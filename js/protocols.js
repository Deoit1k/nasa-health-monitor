/* Review rendering. This does not prescribe treatment or execute medical procedures. */
(function(){
 'use strict';
 function text(tag,value,className){const node=document.createElement(tag);node.textContent=value;if(className)node.className=className;return node;}
 function render(record,previous,acks,onReview){
  const container=document.getElementById('protocols-container');container.replaceChildren();const findings=HealthDomain.evaluate(record,previous);
  document.getElementById('review-count').textContent=record?`${findings.length} prompts`:'No observations';
  if(!record){container.append(text('p','Record your first check-in to see review prompts.','help'));return;}
  if(!findings.length){container.append(text('p','No prototype review rules triggered for this observation. This is not medical clearance; record symptoms and consult your crew medical officer when concerned.','help'));return;}
  for(const f of findings){
   const card=document.createElement('article');card.className='protocol-card';card.append(text('h3',f.title,'protocol-title'),text('p',f.reason,'protocol-desc'),text('p',`Prototype rule: ${f.rule}.`,'rule'),text('p',`Hazard: ${f.hazard}. Confirm the reading, check mission-approved guidance and discuss concerns with the crew medical officer.`,'protocol-desc'));
   const source=text('a','Read source context ↗');source.href=f.source;source.target='_blank';source.rel='noopener noreferrer';card.append(source);
   if(record.source==='simulated')card.append(text('p','Simulation only · not saved','help'));
   else{const ack=acks.find(a=>a.recordId===record.id&&a.ruleId===f.id);if(ack)card.append(text('p',`Reviewed ${new Date(ack.at).toISOString().replace('T',' ').slice(0,19)} UTC · finding remains visible`,'reviewed-at'));else{const button=text('button','Mark reviewed');button.type='button';button.setAttribute('aria-label',`Mark reviewed: ${f.title}`);button.addEventListener('click',()=>onReview(f.id));card.append(button);}}
   container.append(card);
  }
 }
 window.Protocols={render};
})();
