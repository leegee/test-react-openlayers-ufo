import React, { useEffect } from 'react';
import { init } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';

import config from '@ufo-monorepo-test/config/src';
import { RootState } from './redux/store';
import { setLocale } from './redux/guiSlice';

import './LocaleManager.css';

export const translations: Record<string, Promise<any>> = {
    'en': import('./locales/en.json'),
    'no': import('./locales/no.json'),
};

type LocaleKey = keyof typeof translations;

export const useLocale = async (locale?: LocaleKey) => {
    locale = locale ?? config.locale;
    await loadLocale(locale);
}

export const getTranslation = async (locale: LocaleKey) => {
    const translation = await translations[locale] as Record<string, any>;
    return translation;
}

export const loadLocale = async (locale: LocaleKey) => {
    const translation = await getTranslation(locale);
    await init({
        currentLocale: locale,
        locales: { [locale]: translation },
    });
}

const LocaleManager = () => {
    const dispatch = useDispatch();
    const { locale } = useSelector((state: RootState) => state.gui);

    useEffect(() => {
        void loadLocale(locale);
    }, [locale]);

    const handleClick = (locale: LocaleKey) => {
        dispatch(setLocale(locale));
    };

    return (
        <nav>
            {locale ? (
                <>
                    {locale === 'no' ? (
                        <button className='map-ctrl locale-ctrl' onClick={() => handleClick('en')}>🇬🇧</button>
                    ) : (
                        <button className='map-ctrl locale-ctrl' onClick={() => handleClick('no')}>🇳🇴</button>
                    )}
                </>
            ) : (
                <span>Loading...</span>
            )}
        </nav>
    );
};

export default LocaleManager;