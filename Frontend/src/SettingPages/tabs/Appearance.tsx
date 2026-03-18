import { useEffect } from 'react';

export const Appearance = () => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);

        (window as any).googleTranslateElementInit = function() {
            new (window as any).google.translate.TranslateElement({pageLanguage: 'en'}, 'google_translate_element');
        };
    }, []);

    return (
        <div className="Appearance-content">
            <div className="section-intro">
                <h2>Appearance</h2>
                <p>Customize how RepoSphere looks on your device.</p>
            </div>
            
            <div className="theme-form-row">
                <label>Theme</label>
                <div className="Theme-inputs">
                    <select>
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                        <option value="system">System Default</option>
                    </select>
                </div>
            </div>

            <div className="font-size-row">
                <label>Font Size</label>
                <input type="range" min="12" max="24" />
            </div>

            <div className="form-row">
                <h2>Language</h2>
                <div className="Language-row">
                    <p>Choose your default Languages</p>
                </div>

                <div id="google_translate_element"></div>

            </div>

            <div className="Saved-button">
                <button className="btn-spacing">Save Changes</button>
            </div>
        </div>
    );
}
