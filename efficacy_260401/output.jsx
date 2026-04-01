import { useState, useMemo, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const MODELS=[
{id:"HF_TAC",title:"Heart Failure (심부전) - TAC",cat:"심혈관 질환",sp:"C57BL/6 mouse",sex:"male",age:9,ind:"TAC 수술",dur:12,rpt:4,evals:"심장무게, 조직병리, Hydroxyproline assay",pc:"Pirfenidone",steps:[{l:"순화",d:1,u:"w",t:"acclimation"},{l:"TAC 수술",d:1,u:"w",t:"induction"},{l:"시험물질 투여",d:2,u:"w",t:"administration"},{l:"조직병리 & Assay",d:4,u:"w",t:"analysis"}]},
{id:"OA_MIA",title:"Osteoarthritis (퇴행성 관절염) - MIA",cat:"관절염·면역",sp:"SD rat",sex:"male",age:7,ind:"MIA",dur:14,rpt:4,evals:"체중, Incapacitance Tester, 조직병리, Micro CT",pc:"Naproxen",steps:[{l:"순화",d:1,u:"w",t:"acclimation"},{l:"MIA 투여",d:1,u:"w",t:"induction"},{l:"시험물질 투여",d:4,u:"w",t:"administration"},{l:"조직병리",d:4,u:"w",t:"analysis"}]},
{id:"DEM_SCOP",title:"Dementia (치매) - Scopolamine",cat:"중추신경계 질환",sp:"ICR mouse",sex:"male",age:12,ind:"Scopolamine",dur:14,rpt:4,evals:"체중, 행동실험 (수미로)",pc:"Aricept",steps:[{l:"순화",d:1,u:"w",t:"acclimation"},{l:"시험물질 투여",d:4,u:"w",t:"administration"},{l:"적응",d:3,u:"d",t:"observation"},{l:"행동실험",d:4,u:"w",t:"analysis"}]},
{id:"AD_DNCB",title:"Atopic Dermatitis (아토피성 피부염)",cat:"피부 질환",sp:"NC/Nga mouse",sex:"male",age:6,ind:"DNCB",dur:14,rpt:4,evals:"IgE, IL-4, IL-13, 조직병리",pc:"Dexamethasone",steps:[{l:"순화",d:1,u:"w",t:"acclimation"},{l:"DNCB 도포",d:1,u:"w",t:"induction"},{l:"시험물질 투여",d:4,u:"w",t:"administration"},{l:"Cytokine & 조직병리",d:4,u:"w",t:"analysis"}]},
{id:"BREAST_MCF7",title:"Breast Cancer (유방암) - MCF-7",cat:"항암",sp:"BALB/c nude mouse",sex:"female",age:5,ind:"MCF-7 xenograft",dur:13,rpt:4,evals:"종양부피, 종양무게, 사진촬영",pc:"Doxorubicin",steps:[{l:"세포배양",d:2,u:"w",t:"cell_culture"},{l:"순화",d:1,u:"w",t:"acclimation"},{l:"암세포 이식",d:2,u:"w",t:"induction"},{l:"투여 & 부검",d:4,u:"w",t:"administration"}]},
{id:"BIODEG",title:"Biodegrability test (생분해성)",cat:"기타 질환",sp:"SD rat",sex:"male",age:7,ind:"피하 이식",dur:12,rpt:10,evals:"인장강도, Holding force, 조직병리, 실무게측정",pc:"",steps:[{l:"순화",d:1,u:"w",t:"acclimation"},{l:"이식 & 관찰",d:12,u:"w",t:"observation"},{l:"보고서",d:10,u:"w",t:"report"}]},
{id:"CCI",title:"Chronic Pain (만성통증) - CCI",cat:"진통·소염",sp:"SD rat",sex:"male",age:7,ind:"CCI 수술",dur:10,rpt:4,evals:"체중, Hot Plate, Von Frey, Randall Selitto",pc:"",steps:[{l:"순화",d:1,u:"w",t:"acclimation"},{l:"CCI 실시",d:1,u:"w",t:"induction"},{l:"투여",d:3,u:"w",t:"administration"},{l:"통증 측정",d:1,u:"w",t:"analysis"}]},
{id:"LUNG_FIB",title:"Lung fibrosis (폐섬유화)",cat:"호흡기 질환",sp:"C57BL/6 mouse",sex:"male",age:8,ind:"Bleomycin",dur:18,rpt:4,evals:"BALF, Micro-CT, Histological analysis",pc:"Dexamethasone",steps:[{l:"순화",d:1,u:"w",t:"acclimation"},{l:"Bleomycin",d:1,u:"w",t:"induction"},{l:"시험물질 투여",d:4,u:"w",t:"administration"},{l:"Micro-CT & 조직병리",d:8,u:"w",t:"analysis"}]},
{id:"DM2",title:"Type 2 DM (제2형 당뇨)",cat:"대사성 질환",sp:"db/db mouse",sex:"male",age:6,ind:"db/db mice",dur:10,rpt:4,evals:"체중, 혈당, OGTT, Insulin, 조직병리",pc:"Metformin",steps:[{l:"순화",d:1,u:"w",t:"acclimation"},{l:"혈당 & 군분리 & 투여",d:4,u:"w",t:"administration"},{l:"OGTT & 부검",d:1,u:"d",t:"sacrifice"},{l:"분석",d:1,u:"w",t:"analysis"}]},
{id:"ALC_LIVER",title:"Alcoholic Fatty Liver (지방간)",cat:"간질환",sp:"C57BL/6J mouse",sex:"male",age:6,ind:"Alcoholic Diet",dur:17,rpt:4,evals:"간 TG, TC, TNF-a, 혈액생화학, 조직병리",pc:"Silymarin",steps:[{l:"순화",d:1,u:"w",t:"acclimation"},{l:"지방간유도 & 투여",d:6,u:"w",t:"induction"},{l:"혈액생화학",d:2,u:"w",t:"analysis"},{l:"조직병리",d:4,u:"w",t:"analysis"}]},
];

const SC={acclimation:"#6366f1",induction:"#ef4444",administration:"#3b82f6",observation:"#10b981",sacrifice:"#f59e0b",analysis:"#8b5cf6",report:"#6b7280",cell_culture:"#ec4899",custom:"#64748b"};
const SL={acclimation:"순화",induction:"유발",administration:"투여",observation:"관찰",sacrifice:"부검",analysis:"분석",report:"보고서",cell_culture:"세포배양",custom:"기타"};
const CATS=[...new Set(MODELS.map(m=>m.cat))];
const fmt=n=>(n??0).toLocaleString("ko-KR");
const uid=()=>Math.random().toString(36).slice(2,8);
const PC=["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4","#84cc16"];

function Timeline({steps,onUpdate,editable=true,compact=false}){
  const totalD=steps.reduce((s,st)=>s+(st.u==="w"?st.d*7:st.u==="d"?st.d:1),0);
  const [ed,setEd]=useState(null);
  return(
    <div className="relative">
      <div className={`flex items-end gap-0 overflow-x-auto ${compact?"pb-2 pt-4":"pb-8 pt-10"}`}>
        {steps.map((st,i)=>{
          const days=st.u==="w"?st.d*7:st.u==="d"?st.d:1;
          const pct=Math.max((days/totalD)*100,compact?6:8);
          const color=SC[st.t]||"#64748b";
          return(
            <div key={st.id||i} className="flex flex-col items-center group relative" style={{flex:`${pct} 0 0%`,minWidth:compact?"50px":"80px"}}>
              {!compact&&<div className="absolute -top-1 text-[10px] text-gray-400 whitespace-nowrap">{st.d}{st.u==="w"?"주":st.u==="d"?"일":"h"}</div>}
              <div className="w-full relative cursor-pointer" onClick={()=>editable&&setEd(ed===i?null:i)} style={{height:compact?"32px":"44px"}}>
                <div className="absolute inset-0 rounded-lg flex items-center justify-center text-white font-medium px-1.5 transition-all hover:brightness-110" style={{background:color,fontSize:compact?"9px":"11px"}}>
                  <span className="truncate">{st.l}</span>
                </div>
                {i<steps.length-1&&(
                  <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-10">
                    <svg width="12" height="12" viewBox="0 0 16 16"><path d="M4 2l8 6-8 6z" fill={SC[steps[i+1]?.t]||"#94a3b8"}/></svg>
                  </div>
                )}
              </div>
              {compact&&<div className="text-[8px] text-gray-400 mt-0.5">{st.d}{st.u==="w"?"주":st.u==="d"?"일":"h"}</div>}
              {ed===i&&editable&&(
                <div className="absolute top-14 z-30 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-60" onClick={e=>e.stopPropagation()}>
                  <div className="space-y-2">
                    <input value={st.l} onChange={e=>{const n=[...steps];n[i]={...n[i],l:e.target.value};onUpdate(n);}} className="w-full px-2 py-1 border rounded text-sm" placeholder="단계명"/>
                    <div className="flex gap-2">
                      <input type="number" value={st.d} onChange={e=>{const n=[...steps];n[i]={...n[i],d:Number(e.target.value)};onUpdate(n);}} className="w-20 px-2 py-1 border rounded text-sm" min="1"/>
                      <select value={st.u} onChange={e=>{const n=[...steps];n[i]={...n[i],u:e.target.value};onUpdate(n);}} className="flex-1 px-2 py-1 border rounded text-sm"><option value="w">주</option><option value="d">일</option></select>
                    </div>
                    <select value={st.t} onChange={e=>{const n=[...steps];n[i]={...n[i],t:e.target.value};onUpdate(n);}} className="w-full px-2 py-1 border rounded text-sm">
                      {Object.entries(SL).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <button onClick={()=>{const n=[...steps];n.splice(i,0,{l:"새 단계",d:1,u:"w",t:"custom",id:uid()});onUpdate(n);setEd(null);}} className="flex-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">앞에 추가</button>
                      <button onClick={()=>{if(steps.length>1){onUpdate(steps.filter((_,j)=>j!==i));setEd(null);}}} className="flex-1 px-2 py-1 bg-red-50 text-red-600 rounded text-xs">삭제</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {editable&&<button onClick={()=>onUpdate([...steps,{l:"새 단계",d:1,u:"w",t:"custom",id:uid()}])} className="text-xs text-blue-600 hover:text-blue-800">+ 단계 추가</button>}
      <div className="flex justify-between text-[9px] text-gray-400 mt-0.5">
        <span>시작</span><span>총 {Math.ceil(totalD/7)}주 ({totalD}일)</span>
      </div>
    </div>
  );
}

export default function App(){
  const [tab,setTab]=useState(0);
  const [selCat,setSelCat]=useState("");
  const [selModel,setSelModel]=useState(null);
  const [steps,setSteps]=useState([]);
  const [design,setDesign]=useState({species:"",sex:"male",age:7,perGroup:8,groups:4,route:"SC",ind:"",pc:"",rpt:4});
  const [discount,setDiscount]=useState(0.25);
  const [margin,setMargin]=useState(0.1);
  const [client,setClient]=useState({org:"",name:"",phone:"",email:""});
  const [evals,setEvals]=useState([]);

  const selectModel=useCallback((m)=>{
    setSelModel(m);
    setSteps(m.steps.map(s=>({...s,id:uid()})));
    setDesign(d=>({...d,species:m.sp,sex:m.sex,age:m.age,route:"SC",ind:m.ind,pc:m.pc,rpt:m.rpt}));
    setEvals(m.evals.split(",").map(e=>({id:uid(),name:e.trim(),enabled:true})).filter(e=>e.name));
    setTab(1);
  },[]);

  const totalWeeks=useMemo(()=>steps.reduce((s,st)=>s+(st.u==="w"?st.d:st.u==="d"?st.d/7:1/168),0),[steps]);
  const totalAnimals=design.perGroup*design.groups;

  const costItems=useMemo(()=>{
    if(!selModel)return[];
    const it=[];let so=0;const n=totalAnimals;
    it.push({cat:"동물비",name:`${design.species} ${design.age}주령`,up:25000,qty:n,mul:1,sub:25000*n,so:so++});
    const td=Math.ceil(totalWeeks*7);
    it.push({cat:"사육비",name:`사육비 (${td}일)`,up:3000,qty:n,mul:td,sub:3000*n*td,so:so++});
    it.push({cat:"투여",name:`시험물질 투여`,up:50000,qty:n,mul:1,sub:50000*n,so:so++});
    it.push({cat:"체중측정",name:`체중측정 (주1회×${Math.ceil(totalWeeks)}회)`,up:3000,qty:n,mul:Math.ceil(totalWeeks),sub:3000*n*Math.ceil(totalWeeks),so:so++});
    evals.filter(e=>e.enabled).forEach(e=>{
      const hp=e.name.includes("조직병리")||e.name.includes("H&E")||e.name.includes("staining");
      const p=hp?100000:e.name.includes("CT")||e.name.includes("MRI")?300000:e.name.includes("행동")||e.name.includes("maze")?70000:50000;
      it.push({cat:hp?"조직병리":"측정",name:e.name,up:p,qty:n,mul:1,sub:p*n,so:so++});
    });
    it.push({cat:"기타",name:"보고서 작성 및 기타",up:3000000,qty:1,mul:1,sub:3000000,so:so++});
    return it;
  },[selModel,design,totalWeeks,evals,totalAnimals]);

  const totalCost=costItems.reduce((s,i)=>s+i.sub,0);
  const withProfit=Math.round(totalCost*(1+margin));
  const discounted=Math.round(withProfit*(1-discount));
  const byCat=useMemo(()=>{const m={};costItems.forEach(i=>{m[i.cat]=(m[i.cat]||0)+i.sub;});return Object.entries(m).map(([name,value])=>({name,value}));},[costItems]);

  return(
    <div style={{fontFamily:"'Pretendard Variable',-apple-system,sans-serif"}} className="max-w-[1100px] mx-auto bg-white">
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
        <div><h1 className="text-base font-bold text-gray-900">비임상 효력시험 견적 시스템</h1><p className="text-[10px] text-gray-400">코아스템켐온 신약개발지원본부</p></div>
        {selModel&&<span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-medium rounded-full">{selModel.cat}</span>}
      </div>

      <div className="flex border-b border-gray-200">
        {["모델 선택","시험 디자인","비용 계산","견적서"].map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} disabled={i>0&&!selModel} className={`px-4 py-2.5 text-xs font-medium transition-colors relative ${tab===i?"text-blue-600":"text-gray-400 hover:text-gray-600"} ${i>0&&!selModel?"opacity-30 cursor-not-allowed":""}`}>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold" style={{background:tab===i?"#3b82f6":"#e5e7eb",color:tab===i?"#fff":"#9ca3af"}}>{i+1}</span>{t}</span>
            {tab===i&&<span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"/>}
          </button>
        ))}
      </div>

      {tab===0&&(
        <div className="p-5">
          <select value={selCat} onChange={e=>setSelCat(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs mb-4 w-56"><option value="">전체</option>{CATS.map(c=><option key={c} value={c}>{c}</option>)}</select>
          <div className="grid grid-cols-2 gap-3">
            {MODELS.filter(m=>!selCat||m.cat===selCat).map(m=>(
              <div key={m.id} onClick={()=>selectModel(m)} className={`p-3 border rounded-xl cursor-pointer transition-all hover:border-blue-400 hover:shadow ${selModel?.id===m.id?"border-blue-500 bg-blue-50/50":"border-gray-200"}`}>
                <div className="flex items-start justify-between mb-2">
                  <div><div className="text-xs font-semibold text-gray-800">{m.title}</div><div className="text-[10px] text-gray-500 mt-0.5">{m.sp} | {m.age}주령 | {m.dur}주</div></div>
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[9px] rounded-full">{m.cat}</span>
                </div>
                <Timeline steps={m.steps} onUpdate={()=>{}} editable={false} compact={true}/>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab===1&&selModel&&(
        <div className="p-5 space-y-5">
          <div className="p-4 bg-gray-50 rounded-xl">
            <h3 className="text-xs font-semibold text-gray-800 mb-2">스케줄 디자인 — 각 블록을 클릭하여 편집</h3>
            <Timeline steps={steps} onUpdate={setSteps} editable={true}/>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl space-y-2">
              <h3 className="text-xs font-semibold text-gray-800">동물 정보</h3>
              <div className="grid grid-cols-2 gap-2">{[["동물종","species","text"],["주령","age","number"],["군당 마리수","perGroup","number"],["군 수","groups","number"]].map(([l,k,t])=>(<div key={k}><label className="text-[9px] text-gray-500">{l}</label><input type={t} value={design[k]} onChange={e=>setDesign(d=>({...d,[k]:t==="number"?+e.target.value:e.target.value}))} className="w-full px-2 py-1 border rounded text-xs"/></div>))}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl space-y-2">
              <h3 className="text-xs font-semibold text-gray-800">시험 조건</h3>
              {[["유발방법","ind"],["양성대조물질","pc"]].map(([l,k])=>(<div key={k}><label className="text-[9px] text-gray-500">{l}</label><input value={design[k]} onChange={e=>setDesign(d=>({...d,[k]:e.target.value}))} className="w-full px-2 py-1 border rounded text-xs"/></div>))}
            </div>
            <div className="p-3 bg-gray-50 rounded-xl space-y-2">
              <h3 className="text-xs font-semibold text-gray-800">평가항목</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">{evals.map((e,i)=>(<div key={e.id} className="flex items-center gap-1.5"><input type="checkbox" checked={e.enabled} onChange={()=>{const n=[...evals];n[i]={...n[i],enabled:!n[i].enabled};setEvals(n);}} className="rounded w-3 h-3"/><input value={e.name} onChange={ev=>{const n=[...evals];n[i]={...n[i],name:ev.target.value};setEvals(n);}} className="flex-1 px-1.5 py-0.5 border rounded text-[10px]"/><button onClick={()=>setEvals(evals.filter((_,j)=>j!==i))} className="text-red-400 text-[10px]">×</button></div>))}</div>
              <button onClick={()=>setEvals([...evals,{id:uid(),name:"새 평가항목",enabled:true}])} className="text-[10px] text-blue-600">+ 추가</button>
            </div>
          </div>
        </div>
      )}

      {tab===2&&selModel&&(
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-4 gap-3">{[["총 동물",totalAnimals+"마리","blue"],["시험기간",Math.ceil(totalWeeks)+"주","green"],["평가항목",evals.filter(e=>e.enabled).length+"개","purple"],["총 비용",fmt(totalCost)+"원","amber"]].map(([l,v,c])=>(<div key={l} className="rounded-xl p-3 text-center" style={{background:`var(--color-background-${c==="amber"?"warning":c==="green"?"success":c==="purple"?"info":"info"},#f0f9ff)`}}><div className="text-lg font-bold" style={{color:`var(--color-text-${c==="amber"?"warning":c==="green"?"success":"info"},#1e40af)`}}>{v}</div><div className="text-[10px] mt-0.5" style={{color:`var(--color-text-secondary,#6b7280)`}}>{l}</div></div>))}</div>
          <div className="grid grid-cols-5 gap-4">
            <div className="col-span-3 border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-[11px]"><thead><tr className="bg-gray-50"><th className="px-2 py-1.5 text-left text-gray-500">카테고리</th><th className="px-2 py-1.5 text-left text-gray-500">항목</th><th className="px-2 py-1.5 text-right text-gray-500">단가</th><th className="px-2 py-1.5 text-right text-gray-500">수량</th><th className="px-2 py-1.5 text-right text-gray-500">계수</th><th className="px-2 py-1.5 text-right text-gray-500">소계</th></tr></thead>
              <tbody>{costItems.map((it,i)=>(<tr key={i} className={i%2?"bg-gray-50/50":""}><td className="px-2 py-1.5 text-gray-500">{it.cat}</td><td className="px-2 py-1.5 text-gray-800 font-medium">{it.name}</td><td className="px-2 py-1.5 text-right tabular-nums">{fmt(it.up)}</td><td className="px-2 py-1.5 text-right tabular-nums">{it.qty}</td><td className="px-2 py-1.5 text-right tabular-nums">{it.mul}</td><td className="px-2 py-1.5 text-right font-semibold tabular-nums">{fmt(it.sub)}</td></tr>))}<tr className="bg-blue-50 font-semibold"><td colSpan={5} className="px-2 py-1.5 text-blue-800">합계</td><td className="px-2 py-1.5 text-right text-blue-800 tabular-nums">{fmt(totalCost)}</td></tr></tbody></table>
            </div>
            <div className="col-span-2"><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={byCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={35} paddingAngle={2}>{byCat.map((_,i)=><Cell key={i} fill={PC[i%PC.length]}/>)}</Pie><Tooltip formatter={v=>`${fmt(v)}원`}/></PieChart></ResponsiveContainer><div className="flex flex-wrap gap-x-2 gap-y-0.5 justify-center mt-1">{byCat.map((d,i)=><span key={i} className="flex items-center gap-1 text-[9px] text-gray-600"><span className="w-2 h-2 rounded-sm" style={{background:PC[i%PC.length]}}/>{d.name}</span>)}</div></div>
          </div>
        </div>
      )}

      {tab===3&&selModel&&(
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-xl space-y-2"><h3 className="text-xs font-semibold">의뢰 정보</h3><div className="grid grid-cols-2 gap-2">{[["의뢰기관","org"],["의뢰자","name"],["연락처","phone"],["이메일","email"]].map(([l,k])=>(<div key={k}><label className="text-[9px] text-gray-500">{l}</label><input value={client[k]} onChange={e=>setClient(p=>({...p,[k]:e.target.value}))} className="w-full px-2 py-1 border rounded text-xs"/></div>))}</div></div>
            <div className="p-3 bg-gray-50 rounded-xl space-y-2"><h3 className="text-xs font-semibold">견적 조건</h3><div><label className="text-[9px] text-gray-500">영업이익률: {(margin*100).toFixed(0)}%</label><input type="range" min="0" max="0.3" step="0.05" value={margin} onChange={e=>setMargin(+e.target.value)} className="w-full"/></div><div><label className="text-[9px] text-gray-500">할인율: {(discount*100).toFixed(0)}%</label><input type="range" min="0" max="0.4" step="0.05" value={discount} onChange={e=>setDiscount(+e.target.value)} className="w-full"/></div></div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 space-y-5">
            <div className="text-center border-b pb-3"><div className="text-xl font-bold tracking-widest text-gray-800">견 적 서</div><div className="text-[10px] text-gray-400">코아스템켐온㈜ 비임상CRO사업부</div></div>
            <div className="grid grid-cols-2 gap-6 text-xs"><div className="space-y-0.5">{[["견적번호",`26-04-P-${String(Math.floor(Math.random()*9000+1000))}`],["발행날짜",new Date().toISOString().split("T")[0]],["시험기준","non-GLP"]].map(([l,v])=>(<div key={l} className="flex"><span className="text-gray-500 w-14">{l}</span><span className="font-medium">{v}</span></div>))}</div><div className="space-y-0.5">{[["의뢰기관",client.org||"-"],["의뢰자",client.name||"-"],["연락처",client.phone||"-"]].map(([l,v])=>(<div key={l} className="flex"><span className="text-gray-500 w-14">{l}</span><span>{v}</span></div>))}</div></div>

            <div className="bg-gray-50 rounded-lg p-3 text-[11px] space-y-1">
              <div className="font-semibold text-gray-800">{selModel.title}</div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-gray-600">
                <div>시험계: {design.species} ({design.sex}, {design.age}주령)</div>
                <div>유발방법: {design.ind||"N/A"}</div>
                <div>동물 수: {totalAnimals}마리 ({design.perGroup}×{design.groups}군)</div>
                <div>양성대조: {design.pc||"N/A"}</div>
                <div>시험기간: {Math.ceil(totalWeeks)}주</div>
                <div>평가: {evals.filter(e=>e.enabled).map(e=>e.name).join(", ")}</div>
              </div>
            </div>

            <div><div className="text-[10px] font-semibold text-gray-700 mb-1">Study Design</div><div className="border border-gray-200 rounded-lg p-2"><Timeline steps={steps} onUpdate={()=>{}} editable={false} compact={true}/></div></div>

            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4"><div className="grid grid-cols-3 gap-3 text-center"><div><div className="text-[10px] text-blue-500">견적가</div><div className="text-lg font-bold text-blue-800 tabular-nums">{fmt(withProfit)}원</div></div><div><div className="text-[10px] text-green-600">할인가 ({(discount*100).toFixed(0)}%)</div><div className="text-lg font-bold text-green-700 tabular-nums">{fmt(discounted)}원</div></div><div><div className="text-[10px] text-gray-500">VAT 포함</div><div className="text-lg font-bold text-gray-800 tabular-nums">{fmt(Math.round(discounted*1.1))}원</div></div></div></div>

            <div className="border border-gray-200 rounded-lg overflow-hidden"><table className="w-full text-[10px]"><thead><tr className="bg-gray-50"><th className="px-2 py-1 text-left text-gray-500">카테고리</th><th className="px-2 py-1 text-left text-gray-500">항목</th><th className="px-2 py-1 text-right text-gray-500">소계</th></tr></thead><tbody>{costItems.map((it,i)=>(<tr key={i} className={i%2?"bg-gray-50/30":""}><td className="px-2 py-1 text-gray-500">{it.cat}</td><td className="px-2 py-1">{it.name}</td><td className="px-2 py-1 text-right tabular-nums font-medium">{fmt(it.sub)}</td></tr>))}</tbody></table></div>

            <div className="bg-gray-50 rounded-lg p-3 text-[10px] text-gray-500 space-y-0.5"><div className="font-semibold text-gray-700 mb-1">유의사항</div><div>• 모든 금액은 VAT 별도입니다.</div><div>• 본 견적서는 견적일로부터 60일간 유효합니다.</div><div>• 시험개시는 관련서류 및 시험물질 접수 후 진행됩니다.</div><div>• 시험물질은 멸균상태를 유지해서 제공해야 합니다.</div></div>
          </div>
        </div>
      )}

      <div className="px-5 py-2 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
        <span>{selModel?`${selModel.title} | ${totalAnimals}마리 | ${Math.ceil(totalWeeks)}주`:"시험 모델을 선택하세요"}</span>
        {selModel&&<span className="tabular-nums font-medium text-gray-600">{fmt(totalCost)}원</span>}
      </div>
    </div>
  );
}
