<h1 align="center"> iFhany </h1>

<!-- Badges, about the GitHub repository itself -->
<p align="center">
<a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL%20v3-blue.svg"></a>
</p>

iFhany is an extensible self-hosting bot that aims to create a simple and powerful moderation system to make staffers' life easier. From moderators to moderators.

## 📝 History
She was initially created as a private bot in a Discord community called [**Servidor da Fhany**](https://discord.com/invite/fhany), and now has the proposal to help other communities with the tools that we use.
All images used are fanarts created by our incredible artists (we love you :heart:) from our community and all copyrights of the character are guaranteed to youtuber [**Fhany**](https://www.youtube.com/fhany).

## 🛠️ Installation
You can deploy your instance in a few commands. First, clone this repository on your machine:
```bash
git clone -b master https://github.com/Fhany-Server/ifhany.git # you can clone with https, but it's highly recommended to use ssh in other operations
cd ifhany
```
Then, you need to config your hosting files and the enviroment values. A file that iFhany will use is the `config.json`, there is an example:
```json
{
    "tokenProd": "",
    "prodClientId": "",
    "guildId": "",
    "tokenDev": "",
    "devClientId": "",
    "devGuildId": "",
    "invite": "",
}
```
All values ​​with the substring "prod" are used with the `yarn run` command, and each containing "dev" with the `yarn dev` command. So, you will only use the first ones on the hosting platform you are using.
**Do not commit this file to the repository as you will expose the code!!!**
