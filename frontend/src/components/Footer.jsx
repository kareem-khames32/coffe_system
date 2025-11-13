import { Coffee, Code, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-coffee-900 via-coffee-800 to-coffee-900 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <Coffee className="w-6 h-6 text-cream-300" />
            <span className="font-bold text-lg">نظام إدارة المقهى</span>
          </div>

          {/* Developer Credit */}
          <div className="flex items-center gap-2 text-cream-100">
            <span className="text-sm">تم تطويره بواسطة</span>
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
              <Code className="w-4 h-4 text-cream-300" />
              <span className="font-bold text-cream-200">Kareem Khames</span>
            </div>
          </div>

          {/* Made with Love */}
          <div className="flex items-center gap-2 text-sm text-cream-200">
            <span>صنع بـ</span>
            <Heart className="w-4 h-4 text-red-400 fill-red-400 animate-pulse" />
            <span>في مصر</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-4 pt-4 border-t border-white/10 text-center">
          <p className="text-sm text-cream-300">
            © {new Date().getFullYear()} جميع الحقوق محفوظة
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
