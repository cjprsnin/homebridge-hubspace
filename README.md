<p align="center">
  <img src="https://github.com/homebridge/branding/raw/master/logos/homebridge-wordmark-logo-vertical.png" height="150"/>
</p>

<span align="center">
  
  # Homebridge Hubspace
  
  <a href="https://www.npmjs.com/package/@xenuiswatching/homebridge-hubspace">
    <img src="https://img.shields.io/npm/v/@xenuiswatching/homebridge-hubspace.svg?logo=npm&logoColor=fff&label=NPM+package&color=limegreen" alt="Hubspace for Homebridge on npm" />
  </a>
  
</span>

# About plugin
Hubspace is a platform for range of devices sold at HomeDepot. This plugin tries to integrate as many of these devices so that you can control them from HomeKit.

# Disclaimer
I do not own any rights to Hubspace. Any work published here is solely for my own convenience. I am not making any guarantees about the code or products referenced here.

# Tested products
Below you can find a table of products that have been tested with this plugin. Some products share similarities among one another (e.g. lights), however, that does not guarantee that they will all work.

Not all features for all products are implemented. Please see the functions below of what is implemented. If you need a feature that is not implemented create an issue for it.

| Product | Functions supported |
| --- | --- |
| [Universal Smart Wi-Fi 4-Speed Ceiling Fan](https://www.homedepot.com/p/Hampton-Bay-Universal-Smart-Wi-Fi-4-Speed-Ceiling-Fan-White-Remote-Control-For-Use-Only-With-AC-Motor-Fans-Powered-by-Hubspace-76278/315169181?) | <ul><li>Light on/off</li><li>Fan on/off</li><li>Light brightness</li><li>Fan speed</li></ul> |
| [Defiant Smart Plug](https://www.homedepot.com/p/Defiant-15-Amp-120-Volt-Smart-Wi-Fi-Bluetooth-Plug-with-1-Outlet-Powered-by-Hubspace-HPPA11AWB/315636834) | <ul><li>Power on/off</li></ul> |
| [ BR30 Color CCT Light](https://www.homedepot.com/p/EcoSmart-65-Watt-Equivalent-Smart-BR30-Color-Changing-CEC-LED-Light-Bulb-with-Voice-Control-1-Bulb-Powered-by-Hubspace-11BR3065WRGBWH1/318411936) | <ul><li>Power on/off</li><li>Light brightness</li><li>Light color</li><li>Light temperature</li></ul> |
| [A19 Color CCT Light](https://www.homedepot.com/p/EcoSmart-60-Watt-Equivalent-Smart-A19-Color-Changing-CEC-LED-Light-Bulb-with-Voice-Control-1-Bulb-Powered-by-Hubspace-11A19060WRGBWH1/318411935) | <ul><li>Power on/off</li><li>Light brightness</li><li>Light color</li><li>Light temperature</li></ul> |
| [A21 Color CCT Light](https://www.homedepot.com/p/EcoSmart-100-Watt-Equivalent-Smart-A21-Color-Changing-CEC-LED-Light-Bulb-with-Voice-Control-1-Bulb-Powered-by-Hubspace-11A21100WRGBWH1/318411937) | <ul><li>Power on/off</li><li>Light brightness</li><li>Light color</li><li>Light temperature</li></ul> |
| [Husky Smart Water Timer](https://www.homedepot.com/p/Husky-Husky-Smart-Watering-Timer-for-Irrigation-and-Sprinklers-Powered-by-Hub-Space-867006-1004/327680757) | <ul><li>Toggle on/off</li><li>Max On Time</li><li>Battery Percentage</li></ul> |

# Development
There is no official documentation for Hubspace products. Under the hood they use Afero cloud as the mechanism that controls the products. Any functionality here is gained by experimenting with various functions of the devices. Afero provides simple explanation of [their APIs](https://developer.afero.io/API-DeviceEndpoints), however, this is in no way comprehensive.

If you find that a product does not work as intended, or you want to request a new product, please create a ticket for it in the issues section. You are always more than welcome to create a PR with any fixes or additions to the plugin.

## Guidelines

Any code you submit must be readable, be properly commented where necessary, and follow some common sense code quality.

This is a TypeScript project, therefore, TypeScript naming conventions must be followed, unless otherwise specified. Some basic naming conventions are below.

1. Use PascalCase for type names.
1. Do not use I as a prefix for interface names.
1. Use PascalCase for enum values.
1. Use camelCase for function names.
1. Use camelCase for property names and local variables.
1. Use _ as a prefix for private fields.
1. Use whole words in names when possible. Only use abbreviations where their use is common and obvious.

Any ESLint issues need to be resolved before code can be merged. To check for production build linter issues you can run `npm run prepublishOnly`.

## Adding new features
To add new features to the do the following:
1. Create an issue for the feature (unless there is an issue already)
1. Assign the issue to yourself
1. Create a new branch for the issue and name is as _{issue number}-{issue description}_ (e.g. 6-add-laser-support)
1. Once ready issue a PR that is linked to the issue

## Development authentication
Hubspace platform uses [Keycloak](https://www.keycloak.org) for authentication. To develop new features you will need to request JWT from Keycloak to authenticate your requests against the platform.

To get the token send HTTP request with `x-www-form-urlencoded` body to the URL below.
```
POST https://accounts.hubspaceconnect.com/auth/realms/thd/protocol/openid-connect/token
```

Your payload should include the following fields.

| Key | Value |
| --- | --- |
| grant_type | password |
| client_id | hubspace_android |
| username | YOUR_USERNAME |
| password | YOUR_PASSWORD |

Once you receive the token you can make request to Afero with it to investigate the devices and commands.