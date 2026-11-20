// mulberry32, seeded: the one source of randomness that shapes the world,
// so a seed always builds the same city, the same crowd and the same traffic.
export function createRandom(seed){
  let a=seed|0;
  const next=()=>{a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
  return{
    next,
    range(min,max){return min+next()*(max-min);},
    intRange(min,max){return Math.floor(min+next()*(max-min+1));},
    pick(list){return list[Math.floor(next()*list.length)];},
    chance(p){return next()<p;},
  };
}
