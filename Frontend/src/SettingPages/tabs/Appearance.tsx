import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type ThemeOption = 'light' | 'dark' | 'system';
const THEME_STORAGE_KEY = 'repoSphereAppearanceTheme';
const FONT_STORAGE_KEY = 'repoSphereAppearanceFontSize';
const DEFAULT_FONT_SIZE = 16;

const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark' as ThemeOption;
    }
    return 'light' as ThemeOption;
};

const applyTheme = (theme: ThemeOption) => {
    const activeTheme = theme === 'system' ? getSystemTheme() : theme;
    document.documentElement.setAttribute('data-theme', activeTheme);
    document.documentElement.style.colorScheme = activeTheme;
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${activeTheme}-theme`);
};

const applyFontSize = (size: number) => {
    const clamped = Math.max(12, Math.min(32, size));
    document.documentElement.style.fontSize = `${clamped}px`;
    document.documentElement.style.setProperty('--app-base-font-size', `${clamped}px`);
};

export const Appearance = () => {
    const [theme, setTheme] = useState<ThemeOption>('system');
    const [fontSize, setFontSize] = useState<number>(DEFAULT_FONT_SIZE);
    const [savedTheme, setSavedTheme] = useState<ThemeOption>('system');
    const [savedFontSize, setSavedFontSize] = useState<number>(DEFAULT_FONT_SIZE);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);

        (window as any).googleTranslateElementInit = function() {
            new (window as any).google.translate.TranslateElement({ pageLanguage: 'en' }, 'google_translate_element');
        };
    }, []);

    useEffect(() => {
        const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeOption | null;
        const storedFont = localStorage.getItem(FONT_STORAGE_KEY);

        const initialTheme = storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
            ? storedTheme
            : 'system';

        let initialFont = DEFAULT_FONT_SIZE;
        if (storedFont) {
            const parsed = Number(storedFont);
            if (!Number.isNaN(parsed)) initialFont = Math.max(12, Math.min(24, parsed));
        }

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
        localStorage.setItem(FONT_STORAGE_KEY, String(fontSize));

        setSavedTheme(theme);
        setSavedFontSize(fontSize);
        applyTheme(theme);
        applyFontSize(fontSize);
        toast.success('Appearance settings saved.');
    };

    const handleCancel = () => {
        setTheme(savedTheme);
        setFontSize(savedFontSize);
        toast.info('Appearance changes cancelled.');
    };

    return (
        <div className="Appearance-content">
            <div className="section-intro">
                <h2>Appearance</h2>
                <p>Customize how RepoSphere looks on your device.</p>
            </div>

            <div className="theme-form-row">
                <h3>Theme</h3>
                <p>Choose between light, dark, or system default themes.</p>
                <div className="Theme-inputs">
                    <select value={theme} onChange={(e) => setTheme(e.target.value as ThemeOption)}>
                        <option value="light">Light Mode</option>
                        <option value="dark">Dark Mode</option>
                        <option value="system">System Default</option>
                    </select>
                </div>
            </div>

            <div className="font-size-row">
                <h3>Font Size</h3>
                <p>Adjust the font size for better readability ({fontSize}px).</p>
                <input
                    type="range"
                    min={12}
                    max={32}
                    step={1}
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    style={{ width: '100%', height: '18px' }}
                />
            </div>

            <div className="form-row">
                <h3>Language</h3>
                <div className="Language-row">
                    <p>Choose your default language</p>
                </div>

                <div id="google_translate_element"></div>
            </div>

            <div className="button-row" style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                <button className="btn-spacing" onClick={handleCancel}>Cancel</button>
                <button className="btn-spacing" onClick={handleSave}>Save Changes</button>
            </div>
        </div>
    );
};
