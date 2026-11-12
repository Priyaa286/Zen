import { ZenLogo } from './ZenLogo';

/**
 * Compatibility wrapper forwarding legacy ZenMark imports to the official ZenLogo asset.
 */
export function ZenMark({ className = '', ...props }) {
  return <ZenLogo variant="wordmark" size="sm" className={className} {...props} />;
}

export default ZenMark;
