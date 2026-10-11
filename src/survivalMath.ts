// These plain JavaScript functions are included in standalone exports.
export const survivalMathSource=`
function kaplanMeier(records, z) {
  const times = Array.from(new Set(records.map(d => d.time))).sort((a,b) => a-b);
  const points = [{time:0, survival:1, lower:1, upper:1, risk:records.length, events:0, censored:0}];
  let survival = 1, greenwood = 0;
  for (const time of times) {
    const risk = records.filter(d => d.time >= time).length;
    const events = records.filter(d => d.time === time && d.event === 1).length;
    const censored = records.filter(d => d.time === time && d.event === 0).length;
    if (events) {
      survival *= 1 - events / risk;
      if (risk > events) greenwood += events / (risk * (risk - events));
    }
    let lower = survival, upper = survival;
    if (survival > 0 && survival < 1 && greenwood > 0) {
      const log = Math.log(survival), se = Math.sqrt(greenwood) / Math.abs(log);
      lower = Math.exp(-Math.exp(Math.log(-log) + z * se));
      upper = Math.exp(-Math.exp(Math.log(-log) - z * se));
    }
    points.push({time,survival,lower,upper,risk,events,censored});
  }
  return points;
}
function logGamma(z) {
  const coefficients = [676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if (z < .5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI*z)) - logGamma(1-z);
  z -= 1;
  let x = .99999999999980993;
  coefficients.forEach((c,i) => {x += c/(z+i+1);});
  const t = z + 7.5;
  return .5*Math.log(2*Math.PI)+(z+.5)*Math.log(t)-t+Math.log(x);
}
function chiSquareTail(value, df) {
  if (value <= 0) return 1;
  const a = df/2, x = value/2, factor = Math.exp(-x+a*Math.log(x)-logGamma(a));
  if (x < a+1) {
    let sum = 1/a, term = sum;
    for (let n=1;n<1000;n++) {term *= x/(a+n);sum += term;if(Math.abs(term)<Math.abs(sum)*1e-14)break;}
    return Math.max(0,Math.min(1,1-factor*sum));
  }
  let b = x+1-a, c = 1e300, d = 1/Math.max(b,1e-300), h = d;
  for (let i=1;i<1000;i++) {
    const an = -i*(i-a); b += 2;d = an*d+b;if(Math.abs(d)<1e-300)d=1e-300;
    c = b+an/c;if(Math.abs(c)<1e-300)c=1e-300;d = 1/d;
    const delta = d*c;h *= delta;if(Math.abs(delta-1)<1e-14)break;
  }
  return Math.max(0,Math.min(1,factor*h));
}
function logRank(records) {
  const groups = Array.from(new Set(records.map(d => d.group)));
  if (groups.length < 2) return null;
  const k = groups.length-1, observed = Array(k).fill(0), expected = Array(k).fill(0);
  const covariance = Array.from({length:k},()=>Array(k).fill(0));
  const times = Array.from(new Set(records.filter(d => d.event === 1).map(d => d.time))).sort((a,b)=>a-b);
  for (const time of times) {
    const risks = groups.map(g => records.filter(d => d.group === g && d.time >= time).length);
    const events = groups.map(g => records.filter(d => d.group === g && d.time === time && d.event === 1).length);
    const n = risks.reduce((a,b)=>a+b,0), e = events.reduce((a,b)=>a+b,0);
    if (!n) continue;
    for (let i=0;i<k;i++) {
      observed[i] += events[i];expected[i] += e*risks[i]/n;
      for (let j=0;j<k;j++) if (n>1) covariance[i][j] += e*(n-e)/(n-1)*(i===j ? risks[i]/n*(1-risks[i]/n) : -risks[i]*risks[j]/(n*n));
    }
  }
  const diff = observed.map((v,i)=>v-expected[i]);
  const system = covariance.map((row,i)=>[...row,diff[i]]);
  for (let col=0;col<k;col++) {
    let pivot = col;
    for (let row=col+1;row<k;row++) if(Math.abs(system[row][col])>Math.abs(system[pivot][col]))pivot=row;
    if(Math.abs(system[pivot][col])<1e-12)return null;
    [system[col],system[pivot]] = [system[pivot],system[col]];
    const divisor = system[col][col];for(let j=col;j<=k;j++)system[col][j]/=divisor;
    for(let row=0;row<k;row++)if(row!==col){const m=system[row][col];for(let j=col;j<=k;j++)system[row][j]-=m*system[col][j];}
  }
  const statistic = Math.max(0,diff.reduce((s,v,i)=>s+v*system[i][k],0));
  return {statistic,df:k,p:chiSquareTail(statistic,k)};
}
function findCutoff(records, minProp) {
  const values = Array.from(new Set(records.map(d => d.score))).sort((a,b)=>a-b);
  const minimum = Math.max(2,Math.ceil(records.length*minProp));
  let best = null, candidates = 0;
  for (let i=0;i<values.length-1;i++) {
    const cutoff = values[i]/2+values[i+1]/2;
    const split = records.map(d => ({...d,group:d.score<=cutoff ? "Low" : "High"}));
    const low = split.filter(d=>d.group==="Low").length;
    if(low<minimum || split.length-low<minimum)continue;
    candidates++;
    const result = logRank(split);
    if(result && (!best || result.statistic>best.statistic+1e-12))best={...result,cutoff};
  }
  return best ? {...best,candidates,adjustedP:Math.min(1,best.p*candidates)} : null;
}
`;
