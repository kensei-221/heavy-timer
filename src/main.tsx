/**
 * Heavy Timer - エントリーポイント
 * 
 * このファイルはアプリケーションの起動点です。
 * ReactのルートコンポーネントをDOMにマウントします。
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// React 18の新しいcreateRoot APIを使用
// これにより、Concurrent Features（並行レンダリング）が有効になります
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
