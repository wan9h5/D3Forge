export const repositoryUrl = 'https://github.com/wan9h5/D3Forge';

export function GitHubIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.14.68-3.8-1.33-3.8-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.29-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.64 0c2.15-1.46 3.1-1.15 3.1-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.8 1.16 3.02 0 4.32-2.64 5.27-5.15 5.55.4.35.77 1.03.77 2.08v3.1c0 .3.2.65.78.54A11.25 11.25 0 0 0 12 .75Z"/></svg>;
}

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return <footer className={compact ? 'site-footer compact-footer' : 'site-footer'}>
    <div><a className="footer-brand" href="#/">D3Forge</a><span className="footer-caption">可视化配置，带走原生 D3.js 代码。</span></div>
    <nav aria-label="页脚导航"><a href="#/guide">使用说明与须知</a><a href={`${repositoryUrl}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">MIT License</a><a className="github-link" href={repositoryUrl} target="_blank" rel="noopener noreferrer" aria-label="D3Forge GitHub 仓库"><GitHubIcon/><span>GitHub</span></a></nav>
  </footer>;
}
