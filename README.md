# Fishing Log

Aplicación móvil para registrar y visualizar tus capturas de pesca. Construida con **Expo**, **React Native** y **EAS Build**.

## Características
- Registro de capturas con foto y ubicación 📍
- Política de privacidad bilingüe (EN / 中文) 🔒
- Iconos y assets optimizados para release 🖼️
- Build con EAS (APK) ⚙️

## Instalación rápida
```bash
npm install
npm run generate:icons  # opcional: genera iconos optimizados
npx expo start
```

## Build / Publicación
- Build en la nube (EAS):
```bash
eas build --platform android --profile production
```

## Notas importantes
- Mantener `bundleIdentifier` / `package` intacto para poder actualizar la app en AppGallery.
- Política de privacidad visible en inglés y chino.

## Licencia
MIT
