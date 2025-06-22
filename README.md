# LB2 Application

This application has been deliberately programmed with security vulnerabilities and should never be used in a production environment. It is used for a school project.

The application is available as either a PHP or a NodeJS version. Depending on which version you want to use for LB2, you need to provide the appropriate Docker Compose file:

* For PHP: `docker compose -f compose.php.yaml up`
* For NodeJS: `docker compose -f compose.node.yaml up`

Before starting the containers, you need to install the dependencies by running npm install.
Make sure to run this command inside the todo-list-node directory.

* Username: admin1
* Password: Awesome.Pass3
* TOTP Secret: I44TAOLCLJAU2RTBMRAFGUDWFFMG2RKE

User

* Username: user1
* Password: Amazing.Pass23
* TOTP Secret: I44TAOLCLJAU2RTBMRAFGUDWFFMG2RKE