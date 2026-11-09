"use client";

export default function Testimonials() {
  const reviews = [
    { 
      name: "Sarah Marc", 
      role: "CEO @ TechFlow", 
      text: "Velora a réduit notre temps de facturation de moitié. L'interface est intuitive et le gain de productivité est immédiat." 
    },
    { 
      name: "Thomas Durand", 
      role: "Freelance Design", 
      text: "C'est l'outil le plus propre que j'ai utilisé. Le support client est réactif et les fonctionnalités sont exactement ce qu'il faut." 
    }
  ];

  return (
    <section className="py-24 bg-white/50 backdrop-blur-sm" id="testimonials">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
            Ils nous font confiance
          </h2>
          <div className="h-1 w-20 bg-blue-600 mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {reviews.map((r, i) => (
            <div 
              key={i} 
              className="relative p-10 rounded-[2.5rem] border border-gray-200 bg-white/80 shadow-md hover:shadow-xl transition-all duration-500 group"
            >
              {/* Citation mark as background */}
              <span className="absolute top-6 right-10 text-8xl text-gray-200 font-serif opacity-60 group-hover:text-blue-200 transition-colors">
                &ldquo;
              </span>

              <p className="text-gray-700 italic text-lg leading-relaxed mb-8 relative z-10">
                {r.text}
              </p>

              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl rotate-3 group-hover:rotate-0 transition-transform duration-300" />
                <div>
                  <p className="font-bold text-gray-900">{r.name}</p>
                  <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em]">
                    {r.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}