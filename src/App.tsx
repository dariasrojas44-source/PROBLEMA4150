import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings2, 
  BookOpen, 
  Calculator, 
  Rotate3d, 
  ChevronRight, 
  Info,
  Maximize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// --- Subcomponents ---

interface Variables {
  load: number;
  leverLength: number;
  pulleyRadius: number;
  distBC: number;
  distCD: number;
  distDE: number;
}

const StaticsVisualizer = ({ vars, results }: { vars: Variables; results: any }) => {
  // Simple 3D projection: (x, y, z) -> (scale*(x - z*0.5), scale*(-y + z*0.5))
  const scale = 1.2;
  const project = (x: number, y: number, z: number) => {
    const px = (x - z * 0.4) * scale + 100;
    const py = (-y + z * 0.4) * scale + 150;
    return { x: px, y: py };
  };

  const b = project(0, 0, 0);
  const a = project(0, 0, vars.leverLength);
  const c = project(vars.distBC, 0, 0);
  const d = project(vars.distBC + vars.distCD, 0, 0);
  const e = project(vars.distBC + vars.distCD + vars.distDE, 0, 0);

  // Pulley points
  const pulleyCenter = e;
  const pulleyTop = project(vars.distBC + vars.distCD + vars.distDE, vars.pulleyRadius, 0);

  return (
    <div className="relative w-full h-[400px] bg-slate-50 rounded-xl border border-slate-200 overflow-hidden shadow-inner font-mono text-[10px]">
      <svg viewBox="0 0 500 400" className="w-full h-full">
        {/* Grids / Axes */}
        <g stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2">
          <line x1="50" y1="350" x2="450" y2="350" /> {/* x-axis guide */}
          <line x1="50" y1="350" x2="50" y2="50" />  {/* y-axis guide */}
        </g>
        
        {/* Shaft BE */}
        <line x1={b.x} y1={b.y} x2={e.x} y2={e.y} stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
        <line x1={b.x} y1={b.y} x2={e.x} y2={e.y} stroke="#f8fafc" strokeWidth="2" strokeLinecap="round" strokeDasharray="1,4" opacity="0.5" />
        
        {/* Lever AB */}
        <line x1={b.x} y1={b.y} x2={a.x} y2={a.y} stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
        
        {/* Bearings C and D */}
        <g>
          <rect x={c.x - 12} y={c.y - 12} width="24" height="24" rx="4" fill="#64748b" />
          <circle cx={c.x} cy={c.y} r="4" fill="#f8fafc" />
        </g>
        <g>
          <rect x={d.x - 12} y={d.y - 12} width="24" height="24" rx="4" fill="#64748b" />
          <circle cx={d.x} cy={d.y} r="4" fill="#f8fafc" />
        </g>
        
        {/* Pulley at E */}
        <circle cx={pulleyCenter.x} cy={pulleyCenter.y} r={vars.pulleyRadius * 0.45} fill="#e2e8f0" stroke="#0ea5e9" strokeWidth="3" />
        <circle cx={pulleyCenter.x} cy={pulleyCenter.y} r={vars.pulleyRadius * 0.15} fill="#0284c7" />

        {/* Forces */}
        <defs>
          <marker id="arrowhead-red" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
          <marker id="arrowhead-blue" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>
        
        {/* Load P at A */}
        <line x1={a.x} y1={a.y} x2={a.x} y2={a.y + 70} stroke="#ef4444" strokeWidth="4" markerEnd="url(#arrowhead-red)" />
        <text x={a.x + 10} y={a.y + 60} fill="#ef4444" fontWeight="bold" className="text-sm">P = {vars.load} N</text>
        
        {/* Tension T at Pulley */}
        <line x1={pulleyTop.x} y1={pulleyTop.y} x2={pulleyTop.x + 100} y2={pulleyTop.y} stroke="#3b82f6" strokeWidth="4" markerEnd="url(#arrowhead-blue)" />
        <text x={pulleyTop.x + 20} y={pulleyTop.y - 10} fill="#3b82f6" fontWeight="bold" className="text-sm">T = {results.T.toFixed(1)} N</text>

        {/* Labels */}
        <text x={a.x} y={a.y - 10} textAnchor="middle" className="text-slate-500">A</text>
        <text x={b.x} y={b.y + 20} textAnchor="middle" className="text-slate-500">B</text>
        <text x={c.x} y={c.y + 20} textAnchor="middle" className="text-slate-500">C</text>
        <text x={d.x} y={d.y + 20} textAnchor="middle" className="text-slate-500">D</text>
        <text x={e.x} y={e.y + 20} textAnchor="middle" className="text-slate-500">E</text>

        {/* Legend */}
        <g transform="translate(10, 20)">
          <text y="0" className="text-slate-400">Plano Isométrico (Simplificado)</text>
          <line x1="0" y1="20" x2="30" y2="20" stroke="#334155" strokeWidth="2" />
          <text x="35" y="24">Eje Principal</text>
        </g>
      </svg>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'variables' | 'math' | 'steps'>('variables');
  const [vars, setVars] = useState<Variables>({
    load: 720,
    leverLength: 200,
    pulleyRadius: 120,
    distBC: 80,
    distCD: 120,
    distDE: 40
  });

  const results = useMemo(() => {
    // Statics calc
    // Sum Mx = 0: P * leverLength - T * pulleyRadius = 0
    const T = (vars.load * vars.leverLength) / vars.pulleyRadius;
    
    // Sum My at C = 0: -P * 0 (in x) doesn't catch it. We need full 3D moments about C.
    // Positions relative to B (B is 0,0,0)
    // C is (distBC, 0, 0)
    // Moment about C: r_rel x F
    // A relative to C: (-distBC, 0, leverLength)
    // Force at A: (0, -load, 0)
    // Ma = (-distBC, 0, L) x (0, -P, 0) = (P*L, 0, distBC*P)  [i, j, k]
    // D relative to C: (distCD, 0, 0)
    // Force at D: (0, Dy, Dz)
    // Md = (distCD, 0, 0) x (0, Dy, Dz) = (0, -distCD*Dz, distCD*Dy)
    // T application relative to C: (distCD + distDE, pulleyRadius, 0)
    // Force T: (0, 0, -T)
    // Mt = (CD+DE, r, 0) x (0, 0, -T) = (-r*T, (CD+DE)*T, 0)
    
    // Sum Mx = P*L - r*T = 0 (Confirmed)
    // Sum My = -CD*Dz + (CD+DE)*T = 0
    const Dz = ((vars.distCD + vars.distDE) * T) / vars.distCD;
    // Sum Mz = distBC*P + distCD*Dy = 0
    const Dy = -(vars.distBC * vars.load) / vars.distCD;
    
    // Sum Force Y = 0: -P + Cy + Dy = 0
    const Cy = vars.load - Dy;
    // Sum Force Z = 0: Cz + Dz - T = 0
    const Cz = T - Dz;
    
    const reactionC = Math.sqrt(Cy * Cy + Cz * Cz);
    const reactionD = Math.sqrt(Dy * Dy + Dz * Dz);

    return { T, Cy, Cz, Dy, Dz, reactionC, reactionD };
  }, [vars]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans selection:bg-blue-100 p-4 md:p-8">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-300 pb-6">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Rotate3d size={24} />
            <span className="text-xs font-bold uppercase tracking-widest">Simulación Técnica v1.0</span>
          </div>
          <h1 className="text-4xl font-light tracking-tight text-slate-800">
            Mecánica Vectorial <span className="text-slate-400 italic">Beer & Johnston</span>
          </h1>
          <p className="text-slate-500 mt-1">Problema <span className="font-mono text-slate-700">4.150</span>: Equilibrio de Ejes y Poleas</p>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Estado</span>
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Estático
            </span>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Incertidumbre</span>
            <span className="text-xs font-mono">±0.001 N</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left Col: Visualization */}
        <section className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Maximize2 size={16} /> Visualización del Sistema
              </h2>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <div className="w-2 h-2 rounded-full bg-slate-200" />
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
            </div>
            
            <StaticsVisualizer vars={vars} results={results} />
            
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Tensión Cuerda (T)</p>
                <p className="text-xl font-mono text-blue-600">{results.T.toFixed(1)} N</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Reacción en C</p>
                <p className="text-xl font-mono text-slate-700">{results.reactionC.toFixed(1)} N</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Reacción en D</p>
                <p className="text-xl font-mono text-slate-700">{results.reactionD.toFixed(1)} N</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800 text-slate-300 p-6 rounded-2xl shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <BookOpen size={120} />
            </div>
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Info size={18} className="text-blue-400" /> Descripción del Problema
            </h3>
            <p className="text-sm leading-relaxed opacity-90">
              Una palanca de <span className="text-blue-400 font-mono">{vars.leverLength} mm</span> y una polea de <span className="text-blue-400 font-mono">{vars.pulleyRadius * 2} mm</span> se sueldan al eje <span className="font-bold text-white">BE</span>. 
              El eje se sostiene mediante cojinetes en <span className="text-white">C</span> y <span className="text-white">D</span>. 
              Se aplica una carga de <span className="text-red-400 font-bold">{vars.load} N</span> en <span className="text-white">A</span>.
              <br/><br/>
              <span className="inline-block p-1 bg-slate-700 rounded text-[10px] text-blue-300 uppercase font-bold">Consigna:</span> Determine la tensión en la cuerda y las reacciones en los cojinetes.
            </p>
          </div>
        </section>

        {/* Right Col: Controls & Math */}
        <section className="bg-white rounded-2xl shadow-lg border border-slate-200 flex flex-col h-[700px]">
          {/* Tabs */}
          <nav className="flex border-b border-slate-200">
            <button 
              onClick={() => setActiveTab('variables')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'variables' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Settings2 size={16} /> Variables
            </button>
            <button 
              onClick={() => setActiveTab('math')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'math' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <Calculator size={16} /> Fundamento
            </button>
            <button 
              onClick={() => setActiveTab('steps')}
              className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'steps' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ChevronRight size={16} /> Resolución
            </button>
          </nav>

          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {activeTab === 'variables' && (
                <motion.div 
                  key="vars"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <VariableInput label="Carga (P)" unit="N" value={vars.load} onChange={(v) => setVars({...vars, load: v})} min={10} max={2000} />
                    <VariableInput label="Palanca (AB)" unit="mm" value={vars.leverLength} onChange={(v) => setVars({...vars, leverLength: v})} min={50} max={500} />
                    <VariableInput label="Polea (r)" unit="mm" value={vars.pulleyRadius} onChange={(v) => setVars({...vars, pulleyRadius: v})} min={20} max={300} />
                    <VariableInput label="BC" unit="mm" value={vars.distBC} onChange={(v) => setVars({...vars, distBC: v})} min={10} max={300} />
                    <VariableInput label="CD" unit="mm" value={vars.distCD} onChange={(v) => setVars({...vars, distCD: v})} min={10} max={300} />
                    <VariableInput label="DE" unit="mm" value={vars.distDE} onChange={(v) => setVars({...vars, distDE: v})} min={10} max={300} />
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-800 flex gap-2">
                       <i className="font-bold italic">Nota:</i> El cojinete en D no ejerce fuerza de empuje axial (D<sub>x</sub> = 0).
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === 'math' && (
                <motion.div 
                  key="math"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="prose prose-slate max-w-none"
                >
                  <MathContent vars={vars} />
                </motion.div>
              )}

              {activeTab === 'steps' && (
                <motion.div 
                  key="steps"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <SolutionStep 
                    num="01" 
                    title="Equilibrio de Momentos en el Eje (x)" 
                    desc={`Evaluamos el torque alrededor del eje BE para encontrar la tensión T necesaria para contrarrestar la carga P.`}
                    formula={`T = \\frac{P \\cdot L_{AB}}{r} = \\frac{${vars.load} \\cdot ${vars.leverLength}}{${vars.pulleyRadius}} = ${results.T.toFixed(2)} \\text{ N}`}
                  />
                  <SolutionStep 
                    num="02" 
                    title="Cálculo de Reacciones Verticales (y)" 
                    desc={`Usamos la suma de momentos respecto a C para aislar Dy y luego Suma Fy para Cy.`}
                    formula={`D_y = ${results.Dy.toFixed(2)} \\text{ N}, \\quad C_y = ${results.Cy.toFixed(2)} \\text{ N}`}
                  />
                  <SolutionStep 
                    num="03" 
                    title="Cálculo de Reacciones Laterales (z)" 
                    desc={`La tensión de la cuerda genera un momento en z que debe ser compensado por los cojinetes.`}
                    formula={`D_z = ${results.Dz.toFixed(2)} \\text{ N}, \\quad C_z = ${results.Cz.toFixed(2)} \\text{ N}`}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>
    </div>
  );
}

const VariableInput = ({ label, unit, value, onChange, min, max }: any) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</label>
    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
      <input 
        type="number" 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-transparent font-mono text-sm outline-none"
      />
      <span className="text-[10px] font-mono text-slate-400">{unit}</span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      value={value} 
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full accent-blue-500 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer mt-1"
    />
  </div>
);

const MathContent = ({ vars }: { vars: Variables }) => {
  const content = `
### Ecuaciones de Equilibrio

Para un sistema en reposo, se deben cumplir las condiciones vectoriales:

$$\\sum \\vec{F} = 0, \\quad \\sum \\vec{M}_C = 0$$

#### 1. Momento en el Eje (Torque)
$$\\sum M_{x} = 0 \\implies P(L_{AB}) - T(r) = 0$$

#### 2. Equilibrio Transversal (Planos y-z)
Descomponemos los momentos en el cojinete $C$:

$$\\sum M_{y} = - (CD) D_z + (CD + DE) T = 0$$

$$\\sum M_{z} = (BC) P + (CD) D_y = 0$$

#### 3. Reacciones de Soporte
Las magnitudes totales en los cojinetes son:

$$R_C = \\sqrt{C_y^2 + C_z^2}, \\quad R_D = \\sqrt{D_y^2 + D_z^2}$$
  `;

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkMath]} 
      rehypePlugins={[rehypeKatex]}
    >
      {content}
    </ReactMarkdown>
  );
};

const SolutionStep = ({ num, title, desc, formula }: any) => (
  <div className="border-l-2 border-blue-200 pl-4 py-2 hover:border-blue-500 transition-colors group">
    <span className="text-[10px] font-mono text-blue-500 font-bold tracking-widest">{num}</span>
    <h4 className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{title}</h4>
    <p className="text-xs text-slate-500 mt-1 mb-2 italic leading-relaxed">{desc}</p>
    <div className="bg-slate-50 p-3 rounded-lg font-mono text-[11px] border border-slate-100 overflow-x-auto shadow-sm">
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeKatex]}
      >
        {`$$${formula}$$`}
      </ReactMarkdown>
    </div>
  </div>
);
