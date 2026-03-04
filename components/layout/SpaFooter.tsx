export function SpaFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Serenity Spa</h3>
            <p className="mt-2 text-xs text-slate-600">Boutique wellness studio for restorative treatments.</p>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900">Company</h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li><a href="/about" className="hover:underline">About</a></li>
              <li><a href="/services" className="hover:underline">Services</a></li>
              <li><a href="/contact" className="hover:underline">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-900">Legal</h4>
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              <li><a href="#" className="hover:underline">Terms</a></li>
              <li><a href="#" className="hover:underline">Privacy</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div className="flex items-center justify-between">
            <p>© {new Date().getFullYear()} Serenity Spa. All rights reserved.</p>
            <p>123 Tranquility Lane, Wellness City · <a href="mailto:hello@serenityspa.example" className="font-medium text-sky-700 hover:underline">hello@serenityspa.example</a></p>
          </div>
        </div>
      </div>
    </footer>
  );
}
