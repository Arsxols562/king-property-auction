import { Save } from "lucide-react";

interface OAuthForm {
  google: { enabled: boolean; clientId: string; clientSecret: string; androidClientId: string };
  github: { enabled: boolean; clientId: string; clientSecret: string };
  facebook: { enabled: boolean; clientId: string; clientSecret: string };
}

interface OAuthTabProps {
  oauthForm: OAuthForm;
  setOAuthForm: (form: OAuthForm) => void;
  isSaving: boolean;
  onSave: () => void;
}

export default function OAuthTab({
  oauthForm,
  setOAuthForm,
  isSaving,
  onSave,
}: OAuthTabProps) {
  return (
    <div>
      <p className="text-sm text-slate-600 mb-6">
        Configure OAuth providers for social login. Users can sign in with
        Google or GitHub.
      </p>

      {/* Google */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-black text-slate-900">🔵 Google OAuth</h4>
          <button
            onClick={() =>
              setOAuthForm({
                ...oauthForm,
                google: { ...oauthForm.google, enabled: !oauthForm.google.enabled },
              })
            }
            className={`relative w-12 h-7 rounded-full transition-all duration-200 ${oauthForm.google.enabled ? "bg-green-500" : "bg-slate-300"}`}
          >
            <div
              className={`absolute top-0.5 size-6 bg-white rounded-full shadow-md transition-all duration-200 ${oauthForm.google.enabled ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              Client ID
            </label>
            <input
              type="text"
              placeholder="Google OAuth Client ID"
              value={oauthForm.google.clientId}
              onChange={(e) =>
                setOAuthForm({
                  ...oauthForm,
                  google: { ...oauthForm.google, clientId: e.target.value },
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              Client Secret
            </label>
            <input
              type="password"
              placeholder="Google OAuth Client Secret"
              value={oauthForm.google.clientSecret}
              onChange={(e) =>
                setOAuthForm({
                  ...oauthForm,
                  google: { ...oauthForm.google, clientSecret: e.target.value },
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
            Android Client ID
          </label>
          <input
            type="text"
            placeholder="Android OAuth Client ID (for mobile app)"
            value={oauthForm.google.androidClientId || ""}
            onChange={(e) =>
              setOAuthForm({
                ...oauthForm,
                google: { ...oauthForm.google, androidClientId: e.target.value },
              })
            }
            className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="text-xs text-slate-400 mt-1">
            For Android app Google Sign-In. Create a separate OAuth Client ID in Google Cloud Console for Android platform.
          </p>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Redirect URI:{" "}
          <code className="bg-blue-100 px-2 py-0.5 rounded">
            {window.location.origin}/api/auth/google/callback
          </code>
        </p>
      </div>

      {/* GitHub */}
      <div className="p-5 bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl border-2 border-slate-200 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-black text-slate-900">🐙 GitHub OAuth</h4>
          <button
            onClick={() =>
              setOAuthForm({
                ...oauthForm,
                github: { ...oauthForm.github, enabled: !oauthForm.github.enabled },
              })
            }
            className={`relative w-12 h-7 rounded-full transition-all duration-200 ${oauthForm.github.enabled ? "bg-green-500" : "bg-slate-300"}`}
          >
            <div
              className={`absolute top-0.5 size-6 bg-white rounded-full shadow-md transition-all duration-200 ${oauthForm.github.enabled ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              Client ID
            </label>
            <input
              type="text"
              placeholder="GitHub OAuth Client ID"
              value={oauthForm.github.clientId}
              onChange={(e) =>
                setOAuthForm({
                  ...oauthForm,
                  github: { ...oauthForm.github, clientId: e.target.value },
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              Client Secret
            </label>
            <input
              type="password"
              placeholder="GitHub OAuth Client Secret"
              value={oauthForm.github.clientSecret}
              onChange={(e) =>
                setOAuthForm({
                  ...oauthForm,
                  github: { ...oauthForm.github, clientSecret: e.target.value },
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Redirect URI:{" "}
          <code className="bg-gray-100 px-2 py-0.5 rounded">
            {window.location.origin}/api/auth/github/callback
          </code>
        </p>
      </div>

      {/* Facebook */}
      <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-black text-slate-900">📘 Facebook OAuth</h4>
          <button
            onClick={() =>
              setOAuthForm({
                ...oauthForm,
                facebook: {
                  ...oauthForm.facebook,
                  enabled: !oauthForm.facebook?.enabled,
                },
              })
            }
            className={`relative w-12 h-7 rounded-full transition-all duration-200 ${oauthForm.facebook?.enabled ? "bg-green-500" : "bg-slate-300"}`}
          >
            <div
              className={`absolute top-0.5 size-6 bg-white rounded-full shadow-md transition-all duration-200 ${oauthForm.facebook?.enabled ? "left-5" : "left-0.5"}`}
            />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              App ID
            </label>
            <input
              type="text"
              placeholder="Facebook App ID"
              value={oauthForm.facebook?.clientId || ""}
              onChange={(e) =>
                setOAuthForm({
                  ...oauthForm,
                  facebook: { ...oauthForm.facebook, clientId: e.target.value },
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase">
              App Secret
            </label>
            <input
              type="password"
              placeholder="Facebook App Secret"
              value={oauthForm.facebook?.clientSecret || ""}
              onChange={(e) =>
                setOAuthForm({
                  ...oauthForm,
                  facebook: {
                    ...oauthForm.facebook,
                    clientSecret: e.target.value,
                  },
                })
              }
              className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Redirect URI:{" "}
          <code className="bg-blue-100 px-2 py-0.5 rounded">
            {window.location.origin}/api/auth/facebook/callback
          </code>
        </p>
      </div>

      <button
        onClick={onSave}
        disabled={isSaving}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
      >
        <Save className="size-4" /> {isSaving ? "Saving..." : "Save OAuth Settings"}
      </button>

      {/* Setup Guide */}
      <div className="mt-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border-2 border-amber-200">
        <h4 className="font-black text-slate-900 mb-4">
          📖 How to Get OAuth Keys
        </h4>
        <div className="space-y-4">
          <details className="group">
            <summary className="font-bold text-blue-700 cursor-pointer hover:text-blue-900">
              🔵 Google OAuth Setup
            </summary>
            <div className="mt-2 text-sm text-slate-600 space-y-2 pl-4">
              <p>
                1. Go to{" "}
                <a
                  href="https://console.cloud.google.com"
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Google Cloud Console
                </a>
              </p>
              <p>2. Create a project → Enable OAuth consent screen (External)</p>
              <p>
                3. Go to Credentials → Create OAuth Client ID → Web application
              </p>
              <p>
                4. Add redirect URI:{" "}
                <code className="bg-blue-100 px-1 rounded">
                  {window.location.origin}/api/auth/google/callback
                </code>
              </p>
              <p>5. Copy Client ID and Client Secret</p>
            </div>
          </details>
          <details className="group">
            <summary className="font-bold text-slate-700 cursor-pointer hover:text-slate-900">
              🐙 GitHub OAuth Setup
            </summary>
            <div className="mt-2 text-sm text-slate-600 space-y-2 pl-4">
              <p>
                1. Go to{" "}
                <a
                  href="https://github.com/settings/developers"
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  GitHub Developer Settings
                </a>
              </p>
              <p>2. Click New OAuth App</p>
              <p>
                3. Set callback URL:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {window.location.origin}/api/auth/github/callback
                </code>
              </p>
              <p>4. Register → Generate Client Secret</p>
              <p>5. Copy Client ID and Client Secret</p>
            </div>
          </details>
          <details className="group">
            <summary className="font-bold text-blue-800 cursor-pointer hover:text-blue-900">
              📘 Facebook OAuth Setup
            </summary>
            <div className="mt-2 text-sm text-slate-600 space-y-2 pl-4">
              <p>
                1. Go to{" "}
                <a
                  href="https://developers.facebook.com"
                  target="_blank"
                  className="text-blue-600 underline"
                >
                  Meta for Developers
                </a>
              </p>
              <p>2. Create App → Consumer → Set name</p>
              <p>3. Add Product → Facebook Login → Web</p>
              <p>
                4. Set redirect URI:{" "}
                <code className="bg-blue-100 px-1 rounded">
                  {window.location.origin}/api/auth/facebook/callback
                </code>
              </p>
              <p>5. Settings → Basic → Copy App ID and App Secret</p>
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
