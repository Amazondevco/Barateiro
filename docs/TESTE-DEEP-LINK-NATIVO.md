# Teste de deep link nativo

O app nativo aceita links com o scheme `checkai://`.

## Rotas suportadas

- `checkai://app` abre o início do app.
- `checkai://avisos` abre avisos.
- `checkai://formularios` abre enviados/formulários.
- `checkai://perfil` abre perfil.
- `checkai://config` abre configurações.
- `checkai://app/rede/<memberId>` abre uma rede específica quando a sessão permitir.

## Android

Com o APK instalado e o aparelho conectado por ADB:

```bash
adb shell am start -a android.intent.action.VIEW -d "checkai://config"
```

Se o operador não estiver logado, o app restaura a sessão quando possível ou envia para login.

## iOS

iOS também registra o scheme `checkai`, mas o teste depende de build via Xcode/TestFlight:

```bash
xcrun simctl openurl booted "checkai://config"
```

## Observação

Universal links HTTPS ainda não foram ativados. Para isso, será necessário publicar `apple-app-site-association` e `assetlinks.json` no domínio oficial.
