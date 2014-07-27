$(function() {
  Parse.$ = jQuery;

  // Inicia a aplicacao do parse
  Parse.initialize("iD91Kruwny1uP1UNRCspAGNHSLHINUkEGuhe2N6E",
   "jcCjFbysCwxymP6dfpBC4QE2ch75S3Y7xwevEvHo");

  // Model de Evento Cha de Bebe
  var Evento = Parse.Object.extend("Evento", {
  	defaults: {
  		nomedobebe: "",
      descricao: "",
      data: $.now(),
      user: Parse.User.current()
    }
  });

  // Model de Presente
  var Presente = Parse.Object.extend("Presente", {
  	defaults: {
  		nome: "",
  		user: null
  	}
  });

  // Model de Convite
  var Convite = Parse.Object.extend("Convite", {
    defaults: {
      mensagem: "",
      req_facebook: "",
      convidados: [],
      user: Parse.User.current()
    }
  });

  var AppState = Parse.Object.extend("AppState");

  // Colecao de Presentes
  var ListaPresentes = Parse.Collection.extend({
  	model: Presente,
  });

  // Tela principal do convite
  var InviteView = Parse.View.extend({
    events: {
      "submit form.invite-form": "aceitar",
      "submit form.invite-form2": "rejeitar"
    },

    inviteTemplate: _.template($("#invite-template").html()),

    el: "#content",

    initialize: function() {
      var self = this;

      var reqId = $.getUrlVar("request_ids").toString();

      var query = new Parse.Query(Convite);
      query.equalTo("req_facebook", reqId);
      query.find({
        success: function(results) {
          console.log(results);
          console.log(Parse.User.current());

          if(!results || results.length == 0) {
            this.$("#error").html("Você não tem convites aguardando resposta.").show();
          }
          else {
            var meuConvite = results[0].attributes;
          }
        },
        error: function(error) {
          this.$("#error").html("Problemas ao requisitar dados do servidor, aguarde e tente novamente.").show();
        }
      });
    },

    aceitar: function() {
      this.render();
    },

    rejeitar: function() {
      this.render();
    },

    render: function(evento) {
      var dataEvento = new Date(meuEvento.data);
      var dataAgora = new Date($.now());
      var diasCont = Math.floor((dataEvento - dataAgora) / (1000*60*60*24));

      var dataStr = $.format.date(meuEvento.data, "dd/MM/yyyy") + " às " + $.format.date(meuEvento.data, "hh:mm");;

      this.$el.html(this.momsTemplate({
        nomedobebe: meuEvento.nomedobebe,
        descricao: meuEvento.descricao,
        data: dataStr,
        diasCont: diasCont,
        convidadosCont: 15,
        presentesCont: 20
      }));

      this.$el.html(this.inviteTemplate);
      this.delegateEvents();
    }
  });

  // View principal do app
  var AppView = Parse.View.extend({
    el: $("#meuchadebebe"),

    initialize: function() {
      this.render();
    },

    render: function() {
      new InviteView();
    }
  });

  var AppRouter = Parse.Router.extend({
    routes: {
      "all": "all",
      "active": "active",
      "completed": "completed"
    },

    initialize: function(options) {
    },

    all: function() {
      state.set({ filter: "all" });
    },

    active: function() {
      state.set({ filter: "active" });
    },

    completed: function() {
      state.set({ filter: "completed" });
    }
  });

  var state = new AppState;

  new AppRouter;
  new AppView;
  Parse.history.start();
});