# Teste do APK Android

## Objetivo

Gerar um APK Android de debug do app nativo em `native-poc/` para teste em
celular real.

## Como gerar

1. Abra o GitHub do repositório.
2. Vá em `Actions`.
3. Rode o workflow `Build APK Android (POC)`.
4. Espere o fim do job `Build APK Android (debug)`.

## Como baixar

Você pode usar um destes caminhos:

1. Baixar o artefato `check-ai-apk` da própria execução.
2. Usar o release/tag `apk-latest`.
3. Configurar `ANDROID_APK_URL` no deploy web para acender o botão do painel em
   `Configurações > Aplicativo`.

## Como instalar no Android

1. Transfira o arquivo `.apk` para o celular.
2. Habilite instalação por fontes desconhecidas, se necessário.
3. Abra o APK e conclua a instalação.

## iPhone / iOS

iPhone não instala `.apk`.

Para iOS, o fluxo correto é:

1. gerar build iOS;
2. distribuir via TestFlight; ou
3. publicar na App Store.
