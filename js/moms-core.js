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
      quantidade: 0,
      usuario: Parse.User.current()
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
  	model: Presente
  });

  // Tela de Login
  var LogInView = Parse.View.extend({
    events: {
      "submit form.login-form": "logIn",
    },

    el: "#full-content",
    
    initialize: function() {
      _.bindAll(this, "logIn");
      this.render();
    },

    logIn: function(e) {
      var self = this;

      Parse.FacebookUtils.logIn("email", {
        success: function(user) {
          FB.api(
            "/me?fields=name,picture",
            function (response) {
              if (response && !response.error) {
                Parse.User.current().save({"name": response.name});
                Parse.User.current().save({"picture": response.picture.data.url});

                self.$(".login-form button").attr("disabled", "disabled");
                self.$el.html("");
                new MomsView();
                self.undelegateEvents();
                delete self;
              }
            }
          );
        },
        error: function(user, error) {
          self.$("#error").html("Problemas ao logar com o Facebook, tente novamente.").show();
          self.$(".login-form button").removeAttr("disabled");
        }
      });

      return false;
    },

    render: function() {
      this.$el.html(_.template($("#login-template").html()));
      this.delegateEvents();
    }
  });

  // Tela principal apos logar
  var MomsView = Parse.View.extend({
    momsTemplate: _.template($("#moms-template").html()),

    el: "#content",

    initialize: function() {
      $("#menu li.active").removeClass("active");
      $("#menu #inicio").parent().toggleClass("active");

      var self = this;

      var query = new Parse.Query(Evento);
      query.equalTo("user", Parse.User.current());
      query.find({
        success: function(results) {
          if(!results || results.length == 0) {
            new EventView();
            self.undelegateEvents();
            delete self;
          }
          else {
            var meuEvento = results[0].attributes;
            self.render(meuEvento);
          }
        },
        error: function(error) {
          this.$("#error").html("Problemas ao requisitar dados do servidor, aguarde e tente novamente.").show();
        }
      });
    },

    render: function(meuEvento) {
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
      this.delegateEvents();
    }
  });

  // Tela do menu lateral
  var MenuView = Parse.View.extend({
    events: {
      "click #inicio": "principal",
      "click #editar-evento": "editarEvento",
      "click #lista-presentes": "listaPresentes",
      "click #convidar": "convidar",
      "click #logout": "logOut",
    },

    el: "#side-menu",

    initialize: function() {
      _.bindAll(this, "principal", "editarEvento", "convidar", "listaPresentes", "logOut");

      this.render();
    },

    principal: function(e) {
      new MomsView();
    },

    editarEvento: function(e) {
      new EventView();
    },

    convidar: function(e) {
      new InviteView();
    },

    listaPresentes: function(e) {
      new ListaPresentesView();
      this.undelegateEvents();
    },

    logOut: function(e) {
      $("#content").html("");
      this.$el.html("");
      Parse.User.logOut();
      new LogInView();
      this.undelegateEvents();
      delete this;
    },

    render: function() {
      this.$el.html(_.template($("#menu-template").html()));
      this.delegateEvents();
    }
  });

  // Tela de criar ou editar evento
  var EventView = Parse.View.extend({
    events: {
      "submit form.event-form": "save",
    },

    el: "#content",

    initialize: function() {
      _.bindAll(this, "save");

      $("#menu li.active").removeClass("active");
      $("#menu #editar-evento").parent().toggleClass("active");

      var self = this;

      var query = new Parse.Query(Evento);
      query.equalTo("user", Parse.User.current());
      query.find({
        success: function(results) {
          var meuEvento = results[0].attributes;
          var objectId = results[0].id;
          self.render(meuEvento, objectId);
        },
        error: function(error) {
          this.$("#error").html("Problemas ao requisitar dados do servidor, aguarde e tente novamente.").show();
        }
      });
    },

    save: function() {
      var self = this;

      var objectId = this.$("#event-objectId").val();
      var nomedobebe = this.$("#event-nomedobebe").val();
      var descricao = this.$("#event-descricao").val();
      var data = this.$("#event-data").val();

      var evt = new Evento();
      evt.id = objectId;
      evt.set("nomedobebe", nomedobebe);
      evt.set("descricao", descricao);
      evt.set("data", data);

      evt.save(null, {
        success: function(evento) {
          new MomsView();
          self.undelegateEvents();
          delete self;
        },
        error: function(error) {
          this.$("#error").html("Problemas ao salvar dados no servidor, aguarde e tente novamente.").show();
        }
      });
    },

    render: function(meuEvento, objectId) {
      this.$el.html(_.template($("#event-template").html()));
      this.delegateEvents();

      if(meuEvento) {
        $("#event-objectId").val(objectId);        
        $("#event-nomedobebe").val(meuEvento.nomedobebe);
        $("#event-descricao").val(meuEvento.descricao);
        $("#event-data").val(meuEvento.data);
      }
    }
  });

var PresenteView = Parse.View.extend({

  tagName:  "tr",

  template: _.template($('#item-presente-template').html()),

  events: {
    "click .presente-delete"   : "clear",
    "dblclick label.presente-nome-content" : "edit",
    "keypress .edit"      : "updateOnEnter",
    "blur .edit"          : "close"
  },

  initialize: function() {
    _.bindAll(this, 'render', 'close', 'remove');
    this.model.bind('destroy', this.remove);
  },

  render: function() {
    $(this.el).html(this.template(this.model.toJSON()));
    this.input = this.$('.edit');
    return this;
  },

  edit: function() {
      $(this.el).addClass("editing");
      this.input.focus();
  },

  clear: function() {
    this.model.destroy();
  },

  close: function() {
    this.model.id = this.input.attr('id');
    this.model.set("nome", this.input.val());
    this.model.save();
      //this.model.save({nome: this.input.val()});
      $(this.el).removeClass("editing");
  },

  updateOnEnter: function(e) {
      if (e.keyCode == 13) this.close();
  }
  
});

//Tela da lista de presentes
var ListaPresentesView = Parse.View.extend({

  events: {
    "submit form.presente-form": "save",
  },

  el: "#content",

  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll', 'save');

    $("#menu li.active").removeClass("active");
    $("#menu #lista-presentes").parent().toggleClass("active");

    var self = this;

    var query = new Parse.Query(Presente);
    query.equalTo("usuario", Parse.User.current());
    query.find({
      success: function(results) {
       var presentes = results;
        self.render(presentes);
      },
      error: function(error) {
        this.$("#error").html("Problemas ao requisitar dados do servidor, aguarde e tente novamente.").show();
      }
    });
  },

  addOne: function(todo) {
      var view = new PresenteView({model: todo});
      this.$("#todo-list").append(view.render().el);
  },

  addAll: function(collection) {
      this.$("#todo-list").html("");
      collection.each(this.addOne);
  },

  save: function() {
    var self = this;

    var nomedopresente = this.$("#event-nomedopresente").val();
    var quantidade = this.$("#event-quantidadedopresente").val();
    var user = Parse.User.current();

    var evt = new Presente();
    evt.set("nome", nomedopresente);
    evt.set("quantidade", parseInt(quantidade));
    evt.set("usuario", user);  

    evt.save(null, {
      success: function(evento) {
        new ListaPresentesView();
        self.undelegateEvents();
        delete self;
      },
      error: function(error) {
        this.$("#error").html("Problemas ao salvar dados no servidor, aguarde e tente novamente.").show();
      }
    });
  },

  render: function(presentes) {
    this.$el.html(_.template($("#presente-template").html()));
    this.delegateEvents();

    //this.addAll(presentes);
    this.$("#todo-list").html("");

    if(presentes && presentes.length > 0){
      for(var i = 0; i < presentes.length; i++) {
        //collection.each(this.addOne);
        this.addOne(presentes[i]);
        //$("#div-lista-presentes").append( '<ul> <li>' + presentes[i].attributes.nome + '</li> <li>' + presentes[i].attributes.quantidade + '</li> </ul>' );
      }
    }
  }
});

  // Tela de convidar amigos
  var InviteView = Parse.View.extend({
    events: {
      "submit form.invite-form": "escolherAmigos",
    },

    el: "#content",

    initialize: function() {
      $("#menu li.active").removeClass("active");
      $("#menu #convidar").parent().toggleClass("active");

      this.render();
    },

    escolherAmigos: function() {
      var self = this;
      var msg = this.$("#invite-message").val();

      if(msg != "") {
        FB.ui({
            method: 'apprequests',
            message: msg
          }, 
          function(response){
            var custom_acl = new Parse.ACL();
            custom_acl.setPublicReadAccess(true);

            var convite = new Convite();
            convite.set("mensagem", msg);
            convite.set("req_facebook", response.request);
            convite.set("convidados", response.to);
            convite.set("user", Parse.User.current());
            convite.setACL(custom_acl);

            convite.save(null, {
              success: function(convite) {
                new MomsView();
                self.undelegateEvents();
                delete self;
              },
              error: function(error) {
                this.$("#error").html("Problemas ao salvar dados no servidor, aguarde e tente novamente.").show();
              }
            });
        });
      }
      else {
        this.$("#error").html("Insira uma mensagem antes de escolher seus amigos a convidar.").show();
      }
    },

    render: function() {
      this.$el.html(_.template($("#invite-template").html()));
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
      if ($.getUrlVar("notif_t")) {
        window.location.replace("convite.html" + window.location.search);
      }
      else if (Parse.User.current()) {
        new MenuView();
        new MomsView();
      }
      else {
        new LogInView();
      }
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