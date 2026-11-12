import { Link } from 'react-router-dom';
import { ShieldCheck, Lock, ExternalLink } from 'lucide-react';

export function SellerFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-white py-4 px-6 text-xs text-[#697586]">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11.5px]">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-[#17202F]">
            Zen Global Merchant Business Centre
          </span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span>Incoterms: DDP Pre-Calculated</span>
          <span className="text-gray-300 hidden sm:inline">•</span>
          <span>Settlement SLA: 72h Post-Dispatch</span>
        </div>

        <div className="flex items-center gap-4 text-gray-500">
          <Link to="/sell" className="hover:text-[#17202F] transition-colors">
            Seller Guide
          </Link>
          <a
            href="mailto:merchants@zen.global"
            className="hover:text-[#17202F] transition-colors"
          >
            Merchant Support
          </a>
          <span className="text-gray-300">© 2026 Zen Global</span>
        </div>
      </div>
    </footer>
  );
}

