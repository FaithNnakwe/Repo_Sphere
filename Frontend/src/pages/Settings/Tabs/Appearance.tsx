import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    applyFontSize,
    applyTheme,
    clampFontSize,
    DEFAULT_FONT_SIZE,
    FONT_STORAGE_KEY,
    getStoredAppearance,
    MAX_FONT_SIZE,
    MIN_FONT_SIZE,
    THEME_STORAGE_KEY,
    type ThemeOption,
} from '../../../utils/appearance';

const FONT_SIZE_PRESETS = [
    { label: 'Compact', value: 15 },
    { label: 'Default', value: 17 },
    { label: 'Comfortable', value: 19 },
    { label: 'Large', value: 21 },
];

const getFontSizeDescription = (size: number) => {
    if (size <= 15) return 'Compact reading size';
    if (size <= 17) return 'Balanced everyday reading';
    if (size <= 19) return 'Comfortable reading support';
    return 'Large text for reduced eye strain';
};

export const Appearance = () => {
    const [theme, setTheme] = useState<ThemeOption>('system');
    const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
    const [savedTheme, setSavedTheme] = useState<ThemeOption>('system');
    const [savedFontSize, setSavedFontSize] = useState<number>(DEFAULT_FONT_SIZE);

    useEffect(() => {
        const renderGoogleTranslate = () => {
            const container = document.getElementById('google_translate_element');
            const translateApi = (window as any).google?.translate?.TranslateElement;

            if (!container || !translateApi) {
                return false;
            }

            if (container.childElementCount > 0) {
                return true;
            }

            container.innerHTML = '';
            new translateApi({ pageLanguage: 'en' }, 'google_translate_element');
            return true;
        };

        (window as any).googleTranslateElementInit = renderGoogleTranslate;

        const existingScript = document.querySelector(
            'script[src*="translate.google.com/translate_a/element.js"]'
        ) as HTMLScriptElement | null;

        if (renderGoogleTranslate()) {
            return;
        }

        if (existingScript) {
            existingScript.addEventListener('load', renderGoogleTranslate, { once: true });
            return () => {
                existingScript.removeEventListener('load', renderGoogleTranslate);
            };
        }

        const script = document.createElement('script');
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        script.addEventListener('load', renderGoogleTranslate, { once: true });
        document.body.appendChild(script);

        return () => {
            script.removeEventListener('load', renderGoogleTranslate);
        };
    }, []);

    useEffect(() => {
        const { theme: initialTheme, fontSize: initialFont } = getStoredAppearance();

        setTheme(initialTheme);
        setSavedTheme(initialTheme);
        setFontSize(initialFont);
        setSavedFontSize(initialFont);

        applyTheme(initialTheme);
        applyFontSize(initialFont);
    }, []);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        applyFontSize(fontSize);
    }, [fontSize]);

    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const listener = () => {
            if (theme === 'system') {
                applyTheme('system');
            }
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', listener);
        } else {
            mediaQuery.addListener(listener);
        }

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', listener);
            } else {
                mediaQuery.removeListener(listener);
            }
        };
    }, [theme]);

    const handleSave = () => {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
        localStorage.setItem(FONT_STORAGE_KEY, String(clampFontSize(fontSize)));

        setSavedTheme(theme);
        setSavedFontSize(clampFontSize(fontSize));
        applyTheme(theme);
        applyFontSize(clampFontSize(fontSize));
        toast.success('Appearance settings saved.');
    };

    const handleCancel = () => {
        setTheme(savedTheme);
        setFontSize(savedFontSize);
        toast.info('Appearance changes cancelled.');
    };

    return (
        <div className="section-intro">
            <div className="intro-text">
                <h2>Appearance</h2>
                <p>Customize how RepoSphere looks on your device.</p>
            </div>

            <div className="Personal-contents">
                <div className="form-row">
                    <h2>Theme</h2>
                    <p>Choose between light, dark, or system default themes.</p>
                    <div className="Theme-inputs">
                        <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeOption)}>
                            <option value="light">Light Mode</option>
                            <option value="dark">Dark Mode</option>
                            <option value="system">System Default</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="Personal-contents-bio">
                <div className="form-row font-size-row">
                    <h2>Font Size</h2>
                    <p>Increase text size and spacing to reduce eye strain across the app.</p>
                    <div className="font-size-controls">
                        <div className="font-size-presets" role="group" aria-label="Font size presets">
                            {FONT_SIZE_PRESETS.map((preset) => (
                                <button
                                    key={preset.value}
                                    type="button"
                                    className={`font-size-preset ${fontSize === preset.value ? 'active' : ''}`}
                                    onClick={() => setFontSize(preset.value)}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>

                        <div className="font-size-slider-row">
                            <label htmlFor="appearance-font-size" className="font-size-label">
                                Text size
                            </label>
                            <div className="font-size-value-group">
                                <span className="font-size-value">{fontSize}px</span>
                                <span className="font-size-hint">{getFontSizeDescription(fontSize)}</span>
                            </div>
                        </div>

                        <input
                            id="appearance-font-size"
                            type="range"
                            min={MIN_FONT_SIZE}
                            max={MAX_FONT_SIZE}
                            step={1}
                            value={fontSize}
                            onChange={(e) => setFontSize(clampFontSize(Number(e.target.value)))}
                        />

                        <div className="font-size-range-labels" aria-hidden="true">
                            <span>{MIN_FONT_SIZE}px</span>
                            <span>{MAX_FONT_SIZE}px</span>
                        </div>

                        <div className="font-size-preview">
                            <p className="font-size-preview-kicker">Preview</p>
                            <p className="font-size-preview-title">Readable text should feel calm, clear, and easy to scan.</p>
                            <p className="font-size-preview-body">
                                This preview reflects your current text size so you can choose a setting that feels comfortable for longer sessions.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="Personal-contents-role">
                <div className="form-row">
                    <h2>Language</h2>
                    <p>Choose your default language.</p>
                    <div id="google_translate_element"></div>
                </div>
            </div>

            <div className="intro-actions">
                <button
                    className="btn-spacing"
                    onClick={handleCancel}
                >
                    Cancel
                </button>
                <button className="btn-spacing" onClick={handleSave}>
                    Save Changes
                </button>
            </div>
        </div>
    );
};