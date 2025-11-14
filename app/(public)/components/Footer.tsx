import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Branding / About */}
          <div>
            <h2 className="text-xl font-bold mb-3">DSG MOPE</h2>
            <p className="text-sm opacity-90 leading-relaxed">
              Delta State Government Ministry of Primary Education — empowering
              education through accessible digital resources and transparency.
            </p>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4 border-l-4 border-accent pl-3">
              Contact Us
            </h3>
            <div className="space-y-3 text-sm opacity-90">
              <div className="flex items-center gap-3 hover:opacity-100 transition">
                <Mail className="h-4 w-4" />
                <span>info@dsgmope.ng</span>
              </div>
              <div className="flex items-center gap-3 hover:opacity-100 transition">
                <MapPin className="h-4 w-4" />
                <span>Asaba, Delta State, Nigeria</span>
              </div>
              <div className="flex items-center gap-3 hover:opacity-100 transition">
                <Phone className="h-4 w-4" />
                <span>+234 (0)901 234 5678</span>
              </div>
            </div>
          </div>

          {/* Official Portal */}
          <div>
            <h3 className="font-semibold text-lg mb-4 border-l-4 border-accent pl-3">
              Official Portal
            </h3>
            <p className="text-sm opacity-90 mb-4">
              Delta State Government Ministry of Primary Education Portal
            </p>
            <a
              href="https://www.dsgmope.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm font-medium underline underline-offset-4 hover:text-accent transition"
            >
              Visit www.dsgmope.ng →
            </a>
          </div>
        </div>

        {/* Divider & Bottom Text */}
        <div className="border-t border-primary-foreground/20 mt-10 pt-6 text-center text-sm opacity-75">
          <p>
            &copy; {new Date().getFullYear()} Delta State Government Ministry of
            Primary Education. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
