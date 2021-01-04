'use strict';

//var vConsole = new VConsole();

// const GOOGLE_CLIENT_ID = '【クライアントID】';
// const GOOGLE_CLIENT_SECRET = '【クライアントシークレット】';
const GOOGLE_REDIRECT_URL = 'https://【サーバのホスト名】/googleapisample/signin.html';
const AUTHORISE_URL = 'https://【サーバのホスト名】/gapi/authorize';

var vue_options = {
    el: "#top",
    data: {
        progress_title: '', // for progress-dialog

        calendar_list: "",
        mail_list: "",
        image_list: "",
        drive_list: ""
    },
    computed: {
    },
    methods: {
        do_authorize: function(){
            this.new_win = open(GOOGLE_REDIRECT_URL, null, 'width=500,height=750');
        },
        callback_authorization_code: async function(err, code, state){
            if( err ){
                alert(err);
                return;
            }

            this.progress_open();
            try{
                var params = {
                    code: code
                };
                var json = await do_post("/gapi/token", params);
                console.log(json);
                this.drive_list = JSON.stringify(json.drive_list.data.files, null , "\t");
                this.image_list = JSON.stringify(json.image_list.mediaItems, null , "\t");
                this.mail_list = JSON.stringify(json.mail_list.data.labels, null , "\t");
                this.calendar_list = JSON.stringify(json.calendar_list.data.items, null , "\t");
            }catch(error){
                console.error(error);
            }finally{
                this.progress_close();
            }

            // var params = {
            //     client_id: GOOGLE_CLIENT_ID,
            //     client_secret: GOOGLE_CLIENT_SECRET,
            //     code: code,
            //     grant_type: "authorization_code",
            //     redirect_uri: GOOGLE_REDIRECT_URL
            // };
            // await do_post_urlencoded("https://oauth2.googleapis.com/token", params)
            // .then(json =>{
            //     console.log(json);
            //     this.token = json;
            // })
            // .catch(error =>{
            //     console.log(error);
            // });
        },
        make_authorize_url: function(){
            return AUTHORISE_URL + '?state=abcd';
        }
    },
    created: function(){
    },
    mounted: function(){
        proc_load();
    }
};
vue_add_methods(vue_options, methods_bootstrap);
vue_add_components(vue_options, components_bootstrap);
var vue = new Vue( vue_options );

function do_post(url, body) {
    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8" });

    return fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: headers
        })
        .then((response) => {
        if (!response.ok)
            throw 'status is not 200';
        return response.json();
    });
}

function do_post_urlencoded(url, params) {
    const headers = new Headers({ 'Content-Type': 'application/x-www-form-urlencoded' });
    var body = new URLSearchParams(params);

    return fetch(url, {
        method: 'POST',
        body: body,
        headers: headers
    })
    .then((response) => {
        if (!response.ok)
            throw 'status is not 200';
        return response.json();
    });
}


