!function(e){var t={};function s(i){if(t[i])return t[i].exports;var o=t[i]={i:i,l:!1,exports:{}};return e[i].call(o.exports,o,o.exports,s),o.l=!0,o.exports}s.m=e,s.c=t,s.d=function(e,t,i){s.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:i})},s.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},s.t=function(e,t){if(1&t&&(e=s(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var i=Object.create(null);if(s.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)s.d(i,o,function(t){return e[t]}.bind(null,o));return i},s.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return s.d(t,"a",t),t},s.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},s.p="",s(s.s=0)}([function(e,t){let s=null,i=null;const o=[],a=()=>{chrome.windows.create({url:"popup.html",type:"popup",width:400,height:600,top:0,left:window.innerWidth-400},e=>{this._popupId=e.id})},n=TonWeb.utils.BN,r=TonWeb.utils.nacl,d=TonWeb.utils.Address,l=TonWeb.utils.fromNano;const c=window.location.href.indexOf("testnet")>-1,h=!!(window.chrome&&chrome.runtime&&chrome.runtime.onConnect);class w{constructor(){this.myAddress=null,this.publicKeyHex=null,this.myMnemonicWords=null,this.balance=null,this.walletContract=null,this.transactions=[],this.updateIntervalId=0,this.lastTransactionTime=0,this.isContractInitialized=!1,this.sendingData=null,this.processingVisible=!1,this.ledgerApp=null,this.isLedger=!1,window.view&&(window.view.controller=this);this.sendToView("setIsTestnet",c),localStorage.removeItem("pwdHash"),this.ton=new TonWeb(new TonWeb.HttpProvider(c?"https://testnet.toncenter.com/api/v2/jsonRPC":"https://toncenter.com/api/v2/jsonRPC",{apiKey:h?"503af517296765c3f1729fcb301b063a00650a50a881eeaddb6307d5d45e21aa":"4f96a149e04e0821d20f9e99ee716e20ff52db7238f38663226b1c0f303003e0"})),this.myAddress=localStorage.getItem("address"),this.publicKeyHex=localStorage.getItem("publicKey"),this.myAddress&&localStorage.getItem("words")?("true"===localStorage.getItem("isLedger")&&(this.isLedger=!0,this.sendToView("setIsLedger",this.isLedger)),this.showMain()):(localStorage.clear(),this.sendToView("showScreen",{name:"start",noAnimation:!0}))}static async wordsToPrivateKey(e){const t=await TonWeb.mnemonic.mnemonicToKeyPair(e);return TonWeb.utils.bytesToBase64(t.secretKey.slice(0,32))}static async saveWords(e,t){localStorage.setItem("words",await async function(e,t){const s=(new TextEncoder).encode(t),i=await crypto.subtle.digest("SHA-256",s),o=crypto.getRandomValues(new Uint8Array(12)),a={name:"AES-GCM",iv:o},n=await crypto.subtle.importKey("raw",i,a,!1,["encrypt"]),r=(new TextEncoder).encode(e),d=await crypto.subtle.encrypt(a,n,r),l=Array.from(new Uint8Array(d)).map(e=>String.fromCharCode(e)).join(""),c=btoa(l);return Array.from(o).map(e=>("00"+e.toString(16)).slice(-2)).join("")+c}(e.join(","),t))}static async loadWords(e){return(await async function(e,t){const s=(new TextEncoder).encode(t),i=await crypto.subtle.digest("SHA-256",s),o=e.slice(0,24).match(/.{2}/g).map(e=>parseInt(e,16)),a={name:"AES-GCM",iv:new Uint8Array(o)},n=await crypto.subtle.importKey("raw",i,a,!1,["decrypt"]),r=atob(e.slice(24)),d=new Uint8Array(r.match(/[\s\S]/g).map(e=>e.charCodeAt(0))),l=await crypto.subtle.decrypt(a,n,d);return(new TextDecoder).decode(l)}(localStorage.getItem("words"),e)).split(",")}async getWallet(){return this.ton.provider.getWalletInfo(this.myAddress)}checkContractInitialized(e){return"active"===e.account_state}getBalance(e){return new n(e.balance)}async getTransactions(e=20){function t(e){if(!e.msg_data)return"";if("msg.dataText"!==e.msg_data["@type"])return"";const t=e.msg_data.text;return(new TextDecoder).decode(TonWeb.utils.base64ToBytes(t))}const s=[],i=await this.ton.getTransactions(this.myAddress,e);for(let e of i){let i=new n(e.in_msg.value);for(let t of e.out_msgs)i=i.sub(new n(t.value));let o="",a="",r="";e.in_msg.source?(o=e.in_msg.source,a=e.in_msg.destination,r=t(e.in_msg)):e.out_msgs.length&&(o=e.out_msgs[0].source,a=e.out_msgs[0].destination,r=t(e.out_msgs[0])),a&&s.push({amount:i.toString(),from_addr:o,to_addr:a,fee:e.fee.toString(),storageFee:e.storage_fee.toString(),otherFee:e.other_fee.toString(),comment:r,date:1e3*e.utime})}return s}async sign(e,t,s,i,o){let a=(await this.getWallet(this.myAddress)).seqno;a||(a=0);const n=i?i.secretKey:null;return this.walletContract.methods.transfer({secretKey:n,toAddress:e,amount:t,seqno:a,payload:s,sendMode:3,stateInit:o})}async showCreated(){this.sendToView("showScreen",{name:"created"}),this.sendToView("disableCreated",!0),this.myMnemonicWords=await TonWeb.mnemonic.generateMnemonic();const e=await w.wordsToPrivateKey(this.myMnemonicWords),t=r.sign.keyPair.fromSeed(TonWeb.utils.base64ToBytes(e)),s=this.ton.wallet.all.v3R2;this.walletContract=new s(this.ton.provider,{publicKey:t.publicKey,wc:0}),this.myAddress=(await this.walletContract.getAddress()).toString(!0,!0,!0),this.publicKeyHex=TonWeb.utils.bytesToHex(t.publicKey),localStorage.setItem("publicKey",this.publicKeyHex),localStorage.setItem("walletVersion","v3R2"),this.sendToView("disableCreated",!1)}async createPrivateKey(){this.showBackup(this.myMnemonicWords,!0)}onBackupWalletClick(){this.afterEnterPassword=async e=>{this.showBackup(e)},this.sendToView("showPopup",{name:"enterPassword"})}showBackup(e,t){this.sendToView("showScreen",{name:"backup",words:e,isFirst:t})}onBackupDone(){localStorage.getItem("words")?this.sendToView("showScreen",{name:"main"}):this.sendToView("showScreen",{name:"wordsConfirm",words:this.myMnemonicWords})}onConfirmDone(e){if(e){let t=!0;if(Object.keys(e).forEach(s=>{this.myMnemonicWords[s]!==e[s]&&(t=!1)}),!t)return;this.showCreatePassword()}}async createLedger(e){let t;switch(e){case"hid":t=await TonWeb.ledger.TransportWebHID.create();break;case"ble":t=await TonWeb.ledger.BluetoothTransport.create();break;default:throw new Error("unknown transportType"+e)}t.setDebugMode(!0),this.isLedger=!0,this.ledgerApp=new TonWeb.ledger.AppTon(t,this.ton);const s=(await this.ledgerApp.getAppConfiguration()).version;if(console.log("ledgerAppConfig=",s),!s.startsWith("2"))throw alert("Please update your Ledger TON-app to v2.0.1 or upper or use old wallet version https://tonwallet.me/prev/"),new Error("outdated ledger ton-app version");const{publicKey:i}=await this.ledgerApp.getPublicKey(0,!1),o=new(0,this.ton.wallet.all.v3R1)(this.ton.provider,{publicKey:i,wc:0});this.walletContract=o;const a=await o.getAddress();this.myAddress=a.toString(!0,!0,!0),this.publicKeyHex=TonWeb.utils.bytesToHex(i)}async importLedger(e){await this.createLedger(e),localStorage.setItem("walletVersion",this.walletContract.getName()),localStorage.setItem("address",this.myAddress),localStorage.setItem("isLedger","true"),localStorage.setItem("ledgerTransportType",e),localStorage.setItem("words","ledger"),localStorage.setItem("publicKey",this.publicKeyHex),this.sendToView("setIsLedger",this.isLedger),this.sendToView("showScreen",{name:"readyToGo"})}showImport(){this.sendToView("showScreen",{name:"import"})}async import(e){if(this.myMnemonicWords=e,this.myMnemonicWords)try{const e=await w.wordsToPrivateKey(this.myMnemonicWords),t=r.sign.keyPair.fromSeed(TonWeb.utils.base64ToBytes(e));let s=[];for(let e of this.ton.wallet.list){const i=new e(this.ton.provider,{publicKey:t.publicKey,wc:0}),o=(await i.getAddress()).toString(!0,!0,!0),a=await this.ton.provider.getWalletInfo(o),r=this.getBalance(a);r.gt(new n(0))&&s.push({balance:r,clazz:e}),console.log(i.getName(),o,a,r.toString())}let i=this.ton.wallet.all.v3R2;s.length>0&&(s.sort((e,t)=>e.balance.cmp(t.balance)),i=s[s.length-1].clazz),await this.importImpl(t,i),this.sendToView("importCompleted",{state:"success"})}catch(e){console.error(e),this.sendToView("importCompleted",{state:"failure"})}else this.sendToView("importCompleted",{state:"failure"})}async importImpl(e,t){this.walletContract=new t(this.ton.provider,{publicKey:e.publicKey,wc:0}),this.myAddress=(await this.walletContract.getAddress()).toString(!0,!0,!0),this.publicKeyHex=TonWeb.utils.bytesToHex(e.publicKey),localStorage.setItem("publicKey",this.publicKeyHex),localStorage.setItem("walletVersion",this.walletContract.getName()),this.showCreatePassword()}showCreatePassword(){this.sendToView("showScreen",{name:"createPassword"})}async savePrivateKey(e){this.isLedger=!1,localStorage.setItem("isLedger","false"),localStorage.setItem("address",this.myAddress),await w.saveWords(this.myMnemonicWords,e),this.myMnemonicWords=null,this.sendToView("setIsLedger",this.isLedger),this.sendToView("showScreen",{name:"readyToGo"}),this.sendToView("privateKeySaved")}async onChangePassword(e,t){let s;try{s=await w.loadWords(e)}catch(e){return void this.sendToView("showChangePasswordError")}await w.saveWords(s,t),this.sendToView("closePopup"),this.sendToView("passwordChanged")}async onEnterPassword(e){let t;try{t=await w.loadWords(e)}catch(e){return void this.sendToView("showEnterPasswordError")}this.afterEnterPassword(t),this.sendToView("passwordEntered")}showMain(){if(this.sendToView("showScreen",{name:"main",myAddress:this.myAddress}),!this.walletContract){const e=localStorage.getItem("walletVersion"),t=e?this.ton.wallet.all[e]:this.ton.wallet.default;this.walletContract=new t(this.ton.provider,{address:this.myAddress,publicKey:this.publicKeyHex?TonWeb.utils.hexToBytes(this.publicKeyHex):void 0,wc:0})}this.updateIntervalId=setInterval(()=>this.update(),5e3),this.update(!0),this.sendToDapp("ton_accounts",[this.myAddress])}initDapp(){this.sendToDapp("ton_accounts",this.myAddress?[this.myAddress]:[]),this.doMagic("true"===localStorage.getItem("magic")),this.doProxy("true"===localStorage.getItem("proxy"))}initView(){this.myAddress&&localStorage.getItem("words")?(this.sendToView("showScreen",{name:"main",myAddress:this.myAddress}),null!==this.balance&&this.sendToView("setBalance",{balance:this.balance.toString(),txs:this.transactions})):this.sendToView("showScreen",{name:"start",noAnimation:!0}),this.sendToView("setIsMagic","true"===localStorage.getItem("magic")),this.sendToView("setIsProxy","true"===localStorage.getItem("proxy"))}update(e){(this.processingVisible&&this.sendingData||null===this.balance||e)&&this.getWallet().then(e=>{const t=this.getBalance(e),s=null===this.balance||0!==this.balance.cmp(t);this.balance=t;const i=this.checkContractInitialized(e)&&e.seqno;console.log("isBalanceChanged",s),console.log("isContractInitialized",i),!this.isContractInitialized&&i&&(this.isContractInitialized=!0),s?this.getTransactions().then(e=>{if(e.length>0){this.transactions=e;const t=e.filter(e=>Number(e.date)>this.lastTransactionTime);if(this.lastTransactionTime=Number(e[0].date),this.processingVisible&&this.sendingData)for(let e of t){const t=new d(e.to_addr).toString(!0,!0,!0),s=new d(this.sendingData.toAddress).toString(!0,!0,!0),i=e.amount,o="-"+this.sendingData.amount.toString();if(t===s&&i===o){this.sendToView("showPopup",{name:"done",message:l(this.sendingData.amount)+" TON have been sent"}),this.processingVisible=!1,this.sendingData=null;break}}}this.sendToView("setBalance",{balance:t.toString(),txs:e})}):this.sendToView("setBalance",{balance:t.toString(),txs:this.transactions})})}async showAddressOnDevice(){this.ledgerApp||await this.createLedger(localStorage.getItem("ledgerTransportType")||"hid");const{address:e}=await this.ledgerApp.getAddress(0,!0,this.ledgerApp.ADDRESS_FORMAT_USER_FRIENDLY+this.ledgerApp.ADDRESS_FORMAT_URL_SAFE+this.ledgerApp.ADDRESS_FORMAT_BOUNCEABLE);console.log(e.toString(!0,!0,!0))}async getFees(e,t,s,i){if(!this.isContractInitialized&&!this.publicKeyHex)return TonWeb.utils.toNano(.010966001);const o=await this.sign(t,e,s,null,i),a=(await o.estimateFee()).source_fees,r=new n(a.in_fwd_fee),d=new n(a.storage_fee),l=new n(a.gas_fee),c=new n(a.fwd_fee);return r.add(d).add(l).add(c)}async showSendConfirm(e,t,s,i,o){if(!e.gt(new n(0))||this.balance.lt(e))return void this.sendToView("sendCheckFailed");if(!d.isValid(t))return void this.sendToView("sendCheckFailed");let a;try{a=await this.getFees(e,t,s,o)}catch(e){return console.error(e),void this.sendToView("sendCheckFailed")}this.balance.sub(a).lt(e)?this.sendToView("sendCheckCantPayFee",{fee:a}):(this.isLedger?(this.sendToView("showPopup",{name:"sendConfirm",amount:e.toString(),toAddress:t,fee:a.toString()},i),this.send(t,e,s,null,o)):(this.afterEnterPassword=async i=>{this.processingVisible=!0,this.sendToView("showPopup",{name:"processing"});const a=await w.wordsToPrivateKey(i);this.send(t,e,s,a,o)},this.sendToView("showPopup",{name:"sendConfirm",amount:e.toString(),toAddress:t,fee:a.toString()},i)),this.sendToView("sendCheckSucceeded"))}showSignConfirm(e,t){return new Promise((s,i)=>{this.isLedger?(alert("sign not supported by Ledger"),i()):(this.afterEnterPassword=async t=>{this.sendToView("closePopup");const i=await w.wordsToPrivateKey(t),o=this.rawSign(e,i);s(o)},this.sendToView("showPopup",{name:"signConfirm",data:e},t))})}async send(e,t,s,i,o){try{let a=0;if(this.isLedger){if(o)throw new Error("stateInit dont supported by Ledger");this.ledgerApp||await this.createLedger(localStorage.getItem("ledgerTransportType")||"hid");const t=new d(e);t.isUserFriendly&&(a+=this.ledgerApp.ADDRESS_FORMAT_USER_FRIENDLY,t.isUrlSafe&&(a+=this.ledgerApp.ADDRESS_FORMAT_URL_SAFE),t.isBounceable&&(a+=this.ledgerApp.ADDRESS_FORMAT_BOUNCEABLE),t.isTestOnly&&(a+=this.ledgerApp.ADDRESS_FORMAT_TEST_ONLY))}if(this.checkContractInitialized(await this.ton.provider.getWalletInfo(e))||(e=new d(e).toString(!0,!0,!1)),this.isLedger){let i=(await this.getWallet(this.myAddress)).seqno;i||(i=0);const o=await this.ledgerApp.transfer(0,this.walletContract,e,t,i,a);this.sendingData={toAddress:e,amount:t,comment:s,query:o},this.sendToView("showPopup",{name:"processing"}),this.processingVisible=!0,await this.sendQuery(o)}else{const a=r.sign.keyPair.fromSeed(TonWeb.utils.base64ToBytes(i)),n=await this.sign(e,t,s,a,o);this.sendingData={toAddress:e,amount:t,comment:s,query:n},await this.sendQuery(n)}}catch(e){console.error(e),this.sendToView("closePopup"),alert("Error sending")}}rawSign(e,t){const s=r.sign.keyPair.fromSeed(TonWeb.utils.base64ToBytes(t)),i=r.sign.detached(TonWeb.utils.hexToBytes(e),s.secretKey);return TonWeb.utils.bytesToHex(i)}async sendQuery(e){console.log("Send"),"ok"===(await e.send())["@type"]||(this.sendToView("closePopup"),alert("Send error"))}onDisconnectClick(){this.myAddress=null,this.publicKeyHex=null,this.balance=null,this.walletContract=null,this.transactions=[],this.lastTransactionTime=0,this.isContractInitialized=!1,this.sendingData=null,this.processingVisible=!1,this.isLedger=!1,this.ledgerApp=null,clearInterval(this.updateIntervalId),localStorage.clear(),this.sendToView("showScreen",{name:"start"}),this.sendToDapp("ton_accounts",[])}doMagic(e){try{this.sendToDapp("ton_doMagic",e)}catch(e){}}doProxy(e){}sendToView(e,t,s){if(window.view)window.view.onMessage(e,t);else{const a={method:e,params:t};i?i.postMessage(a):s&&o.push(a)}}onViewMessage(e,t){switch(e){case"showScreen":switch(t.name){case"created":this.showCreated();break;case"import":this.showImport();break;case"importLedger":this.importLedger(t.transportType)}break;case"import":this.import(t.words);break;case"createPrivateKey":this.createPrivateKey();break;case"passwordCreated":this.savePrivateKey(t.password);break;case"update":this.update(!0);break;case"showAddressOnDevice":this.showAddressOnDevice();break;case"onEnterPassword":this.onEnterPassword(t.password);break;case"onChangePassword":this.onChangePassword(t.oldPassword,t.newPassword);break;case"onSend":this.showSendConfirm(new n(t.amount),t.toAddress,t.comment);break;case"onBackupDone":this.onBackupDone();break;case"onConfirmBack":this.showBackup(this.myMnemonicWords);break;case"onImportBack":this.sendToView("showScreen",{name:"start"});break;case"onConfirmDone":this.onConfirmDone(t.words);break;case"showMain":this.showMain();break;case"onBackupWalletClick":this.onBackupWalletClick();break;case"disconnect":this.onDisconnectClick();break;case"onClosePopup":this.processingVisible=!1;break;case"onMagicClick":localStorage.setItem("magic",t?"true":"false"),this.doMagic(t);break;case"onProxyClick":localStorage.setItem("proxy",t?"true":"false"),this.doProxy(t)}}sendToDapp(e,t){s&&s.postMessage(JSON.stringify({type:"gramWalletAPI",message:{jsonrpc:"2.0",method:e,params:t}}))}requestPublicKey(e){return new Promise((t,s)=>{i||a(),this.afterEnterPassword=async e=>{const s=await w.wordsToPrivateKey(e),i=r.sign.keyPair.fromSeed(TonWeb.utils.base64ToBytes(s));this.publicKeyHex=TonWeb.utils.bytesToHex(i.publicKey),localStorage.setItem("publicKey",this.publicKeyHex),t()},this.sendToView("showPopup",{name:"enterPassword"},e)})}async onDappMessage(e,t){const s=!i;switch(e){case"ton_requestAccounts":return this.myAddress?[this.myAddress]:[];case"ton_requestWallets":if(!this.myAddress)return[];this.publicKeyHex||await this.requestPublicKey(s);const e=localStorage.getItem("walletVersion");return[{address:this.myAddress,publicKey:this.publicKeyHex,walletVersion:e}];case"ton_getBalance":return this.balance?this.balance.toString():"";case"ton_sendTransaction":const o=t[0];return i||a(),o.data&&("hex"===o.dataType?o.data=TonWeb.utils.hexToBytes(o.data):"base64"===o.dataType?o.data=TonWeb.utils.base64ToBytes(o.data):"boc"===o.dataType&&(o.data=TonWeb.boc.Cell.oneFromBoc(TonWeb.utils.base64ToBytes(o.data)))),o.stateInit&&(o.stateInit=TonWeb.boc.Cell.oneFromBoc(TonWeb.utils.base64ToBytes(o.stateInit))),this.showSendConfirm(new n(o.value),o.to,o.data,s,o.stateInit),!0;case"ton_rawSign":const r=t[0];return i||a(),this.showSignConfirm(r.data,s);case"flushMemoryCache":return await chrome.webRequest.handlerBehaviorChanged(),!0}}}const p=new w;window.chrome&&chrome.runtime&&chrome.runtime.onConnect&&chrome.runtime.onConnect.addListener(e=>{"gramWalletContentScript"===e.name?(s=e,s.onMessage.addListener(async e=>{if(!e.message)return;const t=await p.onDappMessage(e.message.method,e.message.params);s&&s.postMessage(JSON.stringify({type:"gramWalletAPI",message:{jsonrpc:"2.0",id:e.message.id,method:e.message.method,result:t}}))}),s.onDisconnect.addListener(()=>{s=null}),p.initDapp()):"gramWalletPopup"===e.name&&(i=e,i.onMessage.addListener((function(e){p.onViewMessage(e.method,e.params)})),i.onDisconnect.addListener(()=>{i=null}),p.initView(),o.forEach(e=>i.postMessage(e)),o.length=0)})}]);