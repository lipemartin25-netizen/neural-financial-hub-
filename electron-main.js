// electron-main.js
const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'Neural Finance Hub',
    backgroundColor: '#050608',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    icon: path.join(__dirname, 'public/icons/icon-512x512.png'),
  });

  const appUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  win.loadURL(appUrl);

  // Interceptar tentativas de navegação interna para fora do domínio da aplicação
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    try {
      const parsedUrl = new URL(navigationUrl);
      const appOrigin = new URL(appUrl).origin;
      if (parsedUrl.origin !== appOrigin) {
        event.preventDefault();
        if (['https:', 'http:'].includes(parsedUrl.protocol)) {
          shell.openExternal(navigationUrl);
        }
      }
    } catch {
      event.preventDefault();
    }
  });

  // Abrir links de novas janelas (target="_blank" ou window.open) no navegador padrão do sistema
  win.webContents.setWindowOpenHandler(({ url }) => {
    try {
      const parsed = new URL(url);
      if (['https:', 'http:'].includes(parsed.protocol)) {
        shell.openExternal(url);
        return { action: 'deny' };
      }
    } catch {}
    return { action: 'deny' };
  });

  // Mensagem amigável caso a página inicial falhe por falta de conexão
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    if (errorCode === -102 || errorCode === -105 || errorCode === -106) {
      win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Neural Finance Hub — Sem Conexão</title>
          <style>
            body { background: #050608; color: #ebe6da; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
            .card { background: #12151a; border: 1px solid rgba(255,255,255,0.08); padding: 40px; border-radius: 12px; max-width: 400px; }
            h2 { color: #c9a858; margin-top: 0; }
            p { color: #9ca3af; font-size: 14px; line-height: 1.5; }
            button { margin-top: 20px; background: #c9a858; color: #050608; border: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; cursor: pointer; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Falha na Conexão</h2>
            <p>Não foi possível conectar ao servidor (${errorDescription}). Verifique sua conexão com a internet e tente novamente.</p>
            <button onclick="window.location.href='${appUrl}'">Recarregar</button>
          </div>
        </body>
        </html>
      `)}`);
    }
  });

  win.removeMenu();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
