import { SiteFooter } from './SiteFooter';
import { GuideFaq } from './GuideFaq';

export function Guide() {
  return <main className="guide-main">
    <GuideFaq/>
    <SiteFooter/>
  </main>;
}
