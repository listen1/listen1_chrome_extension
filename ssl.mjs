// Script to generate the cert for vite dev
import forge from 'node-forge';
const { pki, md } = forge;
import { rmdirSync, mkdirSync, writeFileSync } from 'fs';

const keys = pki.rsa.generateKeyPair(2048);
const cert = pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';

cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
const attrs = [{
    name: 'commonName',
    value: 'local.local'
}, {
    name: 'countryName',
    value: 'CN'
}, {
    shortName: 'ST',
    value: 'Shanghai'
}, {
    name: 'localityName',
    value: 'Shanghai'
}, {
    name: 'organizationName',
    value: 'Test'
}, {
    shortName: 'OU',
    value: 'Test'
}]
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.setExtensions([{
    name: 'basicConstraints',
    cA: true
}, {
    name: 'authorityKeyIdentifier',
    keyid: true,
    issuer: true,
}, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
}, {
    name: 'subjectAltName',
    altNames: [{
        type: 2,
        value: 'localhost'
    }]
}, {
    name: 'subjectKeyIdentifier'
}]);

cert.sign(keys.privateKey, md.sha256.create());
const pem = pki.certificateToPem(cert);
const privateKey = pki.privateKeyToPem(keys.privateKey);
rmdirSync('./cert', { recursive: true });
mkdirSync('./cert');
writeFileSync('./cert/localhost.key', privateKey);
writeFileSync('./cert/localhost.pem', pem);
