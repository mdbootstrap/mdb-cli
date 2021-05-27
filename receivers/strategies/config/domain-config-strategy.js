'use strict';

const inquirer = require('inquirer');

const PublishCommand = require('../../../commands/publish-command');

const Entity = require('../../../models/entity');
const CliStatus = require('../../../models/cli-status');

const HttpWrapper = require('../../../utils/http-wrapper');
const config = require('../../../config');

class DomainConfigStrategy {

    constructor(context, result) {
        this.context = context;
        this.result = result;

        this.context.authenticateUser();

        this.options = {
            hostname: config.host,
            headers: { Authorization: `Bearer ${this.context.userToken}` }
        };

        this.flags = context.getParsedFlags();
    }

    setValue(name, value) {

        this._validateDomain(value);

        if (this.flags['enable-ssl']) {
            return this.enableSsl(value);
        }

        return this._verifyDomainName(value)
            .then(({ domain }) => this.context.mdbConfig.setValue(name, domain))
            .then(() => this.context.mdbConfig.save())
            .then(() => this._publish());
    }

    unsetValue(name) {

        return this._unsetDomain()
            .then(({ url }) => {
                const type = this.context.mdbConfig.getValue('meta.type');

                if (type === Entity.Frontend) {
                    this.context.mdbConfig.unsetValue(name);

                    this.result.addAlert('blue', 'Info', `Your project is now available at: ${url}`);
                } else if (type === Entity.Backend || type === Entity.Wordpress) {
                    this.context.mdbConfig.setValue('domain', url);

                    this.result.addAlert('yellow', 'Warning', `Since this is a ${type} project we had to reset your domain name to the default one. Your project is now available at: ${url}`);
                }
            })
            .then(() => this.context.mdbConfig.save());
    }

    _validateDomain(value) {

        if (!/^(?=.{4,255}$)([a-zA-Z0-9_]([a-zA-Z0-9_-]{0,61}[a-zA-Z0-9_])?\.){1,126}[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]$/.test(value)) {
            throw new Error('Invalid domain name. Do not add the http(s):// part. If you are using *.mdbgo.io subdomain, don\'t omit the .mdbgo.io part as it won\'t work without it.');
        }
    }

    async enableSsl(domain) {
        this.options.path = `/project/certificate`;
        this.options.data = JSON.stringify({ domainName: domain });
        this.options.headers['Content-Length'] = Buffer.byteLength(this.options.data);
        this.options.headers['Content-Type'] = 'application/json';

        const http = new HttpWrapper();

        await http.post(this.options);
        this.result.addAlert('green', 'Success', 'Certificate successfully enabled. Now you need to configure your DNS in order to finalize the configuration.');
    }

    async _verifyDomainName(value) {

        const available = await this._checkIfExists(value);
        if (available) return { domain: value };

        const prompt = inquirer.createPromptModule();
        const inputPrompt = prompt([
            {
                type: 'text',
                message: 'Enter new domain name',
                name: 'domain',
                validate: (value) => {

                    try {
                        this._validateDomain(value);
                    } catch (e) {
                        return e.message;
                    }

                    /* istanbul ignore next */
                    return this._checkIfExists(value)
                        .then((available) => {
                            if (!available) {
                                return 'This name is already taken. Please choose a different one.';
                            }

                            return true;
                        });
                }
            }
        ]);

        inputPrompt.ui.activePrompt.render('This name is already taken. Please choose a different one');

        return inputPrompt;
    }

    async _checkIfExists(value) {

        this.options.path = `/project/domain/verify?domain=${value}`;
        const http = new HttpWrapper();

        const result = await http.get(this.options);
        const { available } = JSON.parse(result.body);

        return available;
    }

    async _unsetDomain() {
        const http = new HttpWrapper();

        this.options.path = `/project/update/${this.context.mdbConfig.getValue('projectName')}`;
        this.options.headers['Content-Length'] = Buffer.byteLength(this.options.data);

        const result = await http.put(this.options);
        if (result.statusCode >= 200 && result.statusCode <= 299) {
            return JSON.parse(result.body);
        }

        throw new Error('Error unsetting your domain.');
    }

    _publish() {
        this.context.entity = this.context.mdbConfig.getValue('meta.type');
        const publish = new PublishCommand(this.context);
        return publish.execute();
    }
}

module.exports = DomainConfigStrategy;
