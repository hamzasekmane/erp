import { Mail } from "lucide-react";

export default function Contact() {
  return (
    <section className="py-24 bg-white/80 backdrop-blur-sm text-gray-900 rounded-[3rem] mx-4 mb-4 overflow-hidden relative shadow-lg">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row gap-16 relative z-10">
        <div className="flex-1">
          <h2 className="text-5xl font-black mb-6 leading-tight">
            Besoin d'aide ? <br />
            <span className="text-blue-600">On vous répond.</span>
          </h2>
          <p className="text-gray-600 text-lg mb-8">
            Notre équipe support est disponible 7j/7 pour vous accompagner.
          </p>
          <div className="space-y-4">
            <p className="flex items-center gap-3 text-gray-700 font-medium">
              <Mail size={18} className="text-blue-600" /> contact@velora.fr
            </p>
          </div>
        </div>
        <div className="flex-1 bg-white shadow-md p-8 rounded-3xl border border-gray-200">
          <form className="space-y-4">
            <input
              type="text"
              placeholder="Votre nom"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400 text-gray-900"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400 text-gray-900"
            />
            <textarea
              placeholder="Comment pouvons-nous vous aider ?"
              rows={4}
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-400 text-gray-900"
            ></textarea>
            <button className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md">
              Envoyer le message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}