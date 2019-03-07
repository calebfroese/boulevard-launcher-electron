# Boulevard Launcher Prototype

This repository contains the Boulevard game launcher made in Electron.
The Boulevard Launcher prototype is a proof of concept that an Electron + Angular app could be used for
delivering the game to players should the decision be to not go with an existing subsystem such as Steam or the Epic Games Store.

This application is not intended for production.
It serves the purpose of demonstrating that:
- Electron can intelligently manage local files
- A good user experience can be delivered with Angular
- The launcher can be highly customized (toolbar, appearance, functionality)


![Boulevard Launcher Updating](https://user-images.githubusercontent.com/19592095/53953949-ae469480-4124-11e9-9eff-cbd501051b29.png)

Currently runs with:

- Angular v7.0.3
- Electron v4.0.7
- Electron Builder v20.28.1
- Node 10

With this, you can:

- Run the launcher in a local development environment with Electron & Hot reload
- Run the launcher in a production environment
- Package the launcher into an executable file for Linux, Windows & Mac

## Game Files

The game prototype artifacts are zipped and deployed to AWS S3.
This launcher will fetch an update file at each load to determine whether to force a mandatory update or the launcher, update the game, or enable play.

```json
{
    "game": {
        "latestVersion": "0.0.0"
    },
    "launcher": {
        "latestVersion": "0.0.0",
        // Brick the launcher and force a download
        "manupVersion": "0.0.0"
    }
}
```

### Local Storage

The game will be updated and versions saved to the default Electron appdata location for the operating system.

`{APPDATA}/Boulevard/versions`

See [Electrons documentation for platform specific paths](https://github.com/electron/electron/blob/master/docs/api/app.md#appgetpathname).

### Mandatory Updating

A core requirement of the Boulevard launcher is the ability to connect to the versioning authority and enforce versioning rules on both the client and the game.
In the future, the launcher can self-update in the same manner as the game.

## Getting Started

Install dependencies with npm :

```bash
npm install
```

There is an issue with `yarn` and `node_modules` that are only used in electron on the backend when the application is built by the packager. Please use `npm` as dependencies manager.

If you want to generate Angular components with Angular-cli , you **MUST** install `@angular/cli` in npm global context.  
Please follow [Angular-cli documentation](https://github.com/angular/angular-cli) if you had installed a previous version of `angular-cli`.

```bash
npm install -g @angular/cli
```

## To build for development

- **in a terminal window** -> npm start

Voila! You can use your Angular + Electron app in a local development environment with hot reload !

The application code is managed by `main.ts`. In this sample, the app runs with a simple Angular App (http://localhost:4200) and an Electron window.  
The Angular component contains an example of Electron and NodeJS native lib import.  
You can disable "Developer Tools" by commenting `win.webContents.openDevTools();` in `main.ts`.

## Included Commands

| Command                    | Description                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm start`                | Build the app. Serve with hot reload inside an Electron app                                                 |
| `npm run ng:serve:web`     | Execute the app in the browser                                                                              |
| `npm run build`            | Build the app. Your built files are in the /dist folder.                                                    |
| `npm run build:prod`       | Build the app with Angular aot. Your built files are in the /dist folder.                                   |
| `npm run electron:local`   | Builds your application and start electron                                                                  |
| `npm run electron:linux`   | Builds your application and creates an app consumable on linux system                                       |
| `npm run electron:windows` | On a Windows OS, builds your application and creates an app consumable in windows 32/64 bit systems         |
| `npm run electron:mac`     | On a MAC OS, builds your application and generates a `.app` file of your application that can be run on Mac |

**This application is optimised. Only /dist folder and node dependencies are included in the executable.**

## Gallery

![screen shot 2019-03-07 at 9 59 42 pm](https://user-images.githubusercontent.com/19592095/53953949-ae469480-4124-11e9-9eff-cbd501051b29.png)

![screen shot 2019-03-07 at 9 58 20 pm](https://user-images.githubusercontent.com/19592095/53953955-b1da1b80-4124-11e9-9d0f-2dd247543b11.png)
