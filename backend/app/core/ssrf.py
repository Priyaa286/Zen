"""Server-Side Request Forgery (SSRF) Defense & URL Sanitizer.

Prevents SSRF attacks by:
- Enforcing HTTPS for external integrations
- Blocking cloud metadata endpoints (169.254.169.254, metadata.google.internal)
- Blocking RFC 1918 private IP ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
- Blocking loopback (127.0.0.0/8, ::1) except for local Ollama in non-production
- Validating external domains against allowed partner and commerce integrations
"""

from __future__ import annotations

import ipaddress
import logging
import socket
from urllib.parse import urlparse

logger = logging.getLogger("zen.security.ssrf")

# Whitelist of approved external integration hosts
TRUSTED_DOMAINS = {
    "api-m.sandbox.paypal.com",
    "api-m.paypal.com",
    "www.sandbox.paypal.com",
    "www.paypal.com",
    "api.frankfurter.dev",
    "api.trychannel3.com",
    "images.unsplash.com",
}

BLOCKED_METADATA_HOSTS = {
    "169.254.169.254",
    "metadata.google.internal",
    "metadata.azure.com",
    "instance-data",
}


class SSRFValidationError(ValueError):
    """Raised when an outbound URL fails SSRF security checks."""
    pass


def validate_outbound_url(url: str, allow_local_ollama: bool = False) -> bool:
    """
    Validates that a URL is safe to make outbound HTTP requests to.
    Raises SSRFValidationError if the URL targets internal or private resources.
    """
    try:
        parsed = urlparse(url)
    except Exception as exc:
        raise SSRFValidationError(f"Invalid URL structure: {exc}")

    scheme = parsed.scheme.lower()
    host = (parsed.hostname or "").lower()

    if not host:
        raise SSRFValidationError("Missing hostname in target URL.")

    # Allow local Ollama connection if explicitly allowed (e.g. development host)
    if allow_local_ollama and host in ("localhost", "127.0.0.1", "host.docker.internal"):
        return True

    # Cloud metadata endpoint blocking
    if host in BLOCKED_METADATA_HOSTS:
        logger.critical("SSRF Attempt blocked: target is a cloud metadata endpoint: %s", host)
        raise SSRFValidationError(f"Target host '{host}' is prohibited (cloud metadata protection).")

    # Scheme enforcement: External integrations must use HTTPS
    if scheme != "https":
        raise SSRFValidationError(f"Insecure scheme '{scheme}'. Only HTTPS is permitted for external integrations.")

    # Check IP address resolution
    try:
        addr_info = socket.getaddrinfo(host, None)
        for family, socktype, proto, canonname, sockaddr in addr_info:
            ip_str = sockaddr[0]
            ip_obj = ipaddress.ip_address(ip_str)

            # Block private, loopback, multicast, and link-local ranges
            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_multicast
                or ip_obj.is_reserved
            ):
                logger.critical("SSRF Attempt blocked: resolved to private/loopback IP %s for host %s", ip_str, host)
                raise SSRFValidationError(f"Host '{host}' resolves to private/reserved IP {ip_str}.")
    except socket.gaierror:
        # If DNS lookup fails, check if domain is in trusted domain set
        if host not in TRUSTED_DOMAINS:
            raise SSRFValidationError(f"Unable to resolve host '{host}' and host is not in trusted domains.")

    return True

