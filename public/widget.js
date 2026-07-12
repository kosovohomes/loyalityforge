(function () {
  "use strict";

  var container = document.getElementById("loyaltyforge-widget");
  if (!container) return;

  var orgSlug = container.getAttribute("data-org");
  if (!orgSlug) return;

  // The widget secret is required by the balance and join endpoints.
  // Cafe owners generate it in /settings/api-keys and paste it into the
  // data-widget-secret attribute of the container div.
  var widgetSecret = container.getAttribute("data-widget-secret") || "";

  var API_BASE = window.LOYALTYFORGE_API_URL || window.location.origin;
  var primaryColor = "#b08d57";
  var espresso = "#3c2415";
  var cream = "#faf6f0";
  var muted = "#6b5e50";

  var style = document.createElement("style");
  style.textContent =
    ".lf-widget{font-family:Inter,system-ui,-apple-system,sans-serif;max-width:400px;margin:0 auto;padding:0}" +
    ".lf-card{background:" + cream + ";border:1px solid #e8e0d4;border-radius:12px;padding:24px;margin-bottom:16px}" +
    ".lf-title{font-size:18px;font-weight:700;color:" + espresso + ";margin:0 0 4px}" +
    ".lf-sub{font-size:13px;color:" + muted + ";margin:0 0 16px}" +
    ".lf-tabs{display:flex;gap:0;margin-bottom:16px;border-radius:8px;overflow:hidden;border:1px solid #e8e0d4}" +
    ".lf-tab{flex:1;padding:10px;text-align:center;font-size:13px;font-weight:600;cursor:pointer;background:transparent;color:" + muted + ";border:none;transition:all .15s}" +
    ".lf-tab.active{background:" + primaryColor + ";color:#fff}" +
    ".lf-field{margin-bottom:12px}" +
    ".lf-label{display:block;font-size:12px;font-weight:600;color:" + espresso + ";margin-bottom:4px}" +
    ".lf-input{width:100%;padding:10px 12px;font-size:14px;border:1px solid #e8e0d4;border-radius:8px;background:#fff;color:" + espresso + ";box-sizing:border-box;outline:none;transition:border-color .15s}" +
    ".lf-input:focus{border-color:" + primaryColor + "}" +
    ".lf-btn{width:100%;padding:12px;font-size:14px;font-weight:700;border:none;border-radius:8px;cursor:pointer;transition:opacity .15s}" +
    ".lf-btn:disabled{opacity:.5;cursor:not-allowed}" +
    ".lf-btn-primary{background:" + primaryColor + ";color:#fff}" +
    ".lf-btn-secondary{background:transparent;border:1px solid #e8e0d4;color:" + espresso + "}" +
    ".lf-msg{padding:10px 12px;border-radius:8px;font-size:13px;margin-top:12px;display:none}" +
    ".lf-msg-ok{background:#e8f5e9;color:#2e7d32;display:block}" +
    ".lf-msg-err{background:#fbe9e7;color:#c62828;display:block}" +
    ".lf-balance-box{text-align:center;padding:16px 0}" +
    ".lf-balance-num{font-size:42px;font-weight:800;color:" + primaryColor + ";line-height:1}" +
    ".lf-balance-label{font-size:13px;color:" + muted + ";margin-top:4px}" +
    ".lf-tier{display:inline-block;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-top:8px;background:" + primaryColor + "22;color:" + primaryColor + "}" +
    ".lf-program-select{margin-bottom:16px}" +
    ".lf-hidden{display:none}" +
    ".lf-link{font-size:12px;color:" + primaryColor + ";text-decoration:underline;cursor:pointer;margin-top:8px;display:inline-block}";
  document.head.appendChild(style);

  var wrapper = document.createElement("div");
  wrapper.className = "lf-widget";
  container.appendChild(wrapper);

  var state = {
    programs: [],
    selectedProgram: null,
    view: "join",
    loading: true,
    email: "",
    name: "",
    balanceEmail: "",
  };

  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (k === "className") el.className = attrs[k];
        else if (k === "onSubmit") el.addEventListener("submit", attrs[k]);
        else if (k === "onClick") el.addEventListener("click", attrs[k]);
        else if (k === "onInput") el.addEventListener("input", attrs[k]);
        else el.setAttribute(k, attrs[k]);
      }
    }
    if (children) {
      if (typeof children === "string") el.textContent = children;
      else if (Array.isArray(children)) children.forEach(function (c) { if (c) el.appendChild(c); });
      else el.appendChild(children);
    }
    return el;
  }

  function render() {
    wrapper.innerHTML = "";
    if (state.loading) {
      wrapper.appendChild(h("div", { className: "lf-card" }, [
        h("p", { className: "lf-sub" }, "Loading...")
      ]));
      return;
    }
    if (!state.programs.length) {
      wrapper.appendChild(h("div", { className: "lf-card" }, [
        h("p", { className: "lf-title" }, "No Programs Available"),
        h("p", { className: "lf-sub" }, "This cafe hasn't published a loyalty program yet.")
      ]));
      return;
    }

    var card = h("div", { className: "lf-card" });

    if (state.programs.length > 1) {
      var sel = h("select", { className: "lf-input lf-program-select", onChange: function (e) {
        state.selectedProgram = state.programs.find(function (p) { return p.id === e.target.value; }) || state.programs[0];
        render();
      }});
      state.programs.forEach(function (p) {
        var opt = h("option", { value: p.id }, p.name + " (" + p.type + ")");
        if (state.selectedProgram && state.selectedProgram.id === p.id) opt.selected = true;
        sel.appendChild(opt);
      });
      card.appendChild(sel);
    } else {
      state.selectedProgram = state.programs[0];
    }

    var tabs = h("div", { className: "lf-tabs" }, [
      h("button", { className: "lf-tab" + (state.view === "join" ? " active" : ""), onClick: function () { state.view = "join"; render(); }}, "Join"),
      h("button", { className: "lf-tab" + (state.view === "balance" ? " active" : ""), onClick: function () { state.view = "balance"; render(); }}, "My Balance")
    ]);
    card.appendChild(tabs);

    if (state.view === "join") {
      renderJoinForm(card);
    } else {
      renderBalanceForm(card);
    }

    wrapper.appendChild(card);
  }

  function renderJoinForm(card) {
    var msgId = "lf-join-msg";

    var emailField = h("div", { className: "lf-field" }, [
      h("label", { className: "lf-label", htmlFor: "lf-email" }, "Email"),
      h("input", { className: "lf-input", id: "lf-email", type: "email", placeholder: "you@example.com", value: state.email, onInput: function (e) { state.email = e.target.value; }})
    ]);

    var nameField = h("div", { className: "lf-field" }, [
      h("label", { className: "lf-label", htmlFor: "lf-name" }, "Name (optional)"),
      h("input", { className: "lf-input", id: "lf-name", type: "text", placeholder: "Your name", value: state.name, onInput: function (e) { state.name = e.target.value; }})
    ]);

    var btn = h("button", { className: "lf-btn lf-btn-primary", type: "submit" }, "Join Program");
    var msg = h("div", { className: "lf-msg", id: msgId });

    var form = h("form", { onSubmit: function (e) {
      e.preventDefault();
      if (!state.email || !state.selectedProgram) return;
      btn.disabled = true;
      btn.textContent = "Joining...";

      fetch(API_BASE + "/api/public/orgs/" + orgSlug + "/programs/" + state.selectedProgram.id + "/join", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-widget-secret": widgetSecret },
        body: JSON.stringify({ email: state.email, name: state.name || undefined }),
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) {
            msg.className = "lf-msg lf-msg-err";
            msg.textContent = data.error;
          } else {
            msg.className = "lf-msg lf-msg-ok";
            msg.textContent = "Welcome! You're enrolled. Balance: " + (data.balance || 0) + " points.";
            state.email = "";
            state.name = "";
          }
          btn.disabled = false;
          btn.textContent = "Join Program";
        })
        .catch(function () {
          msg.className = "lf-msg lf-msg-err";
          msg.textContent = "Something went wrong. Please try again.";
          btn.disabled = false;
          btn.textContent = "Join Program";
        });
    }}, [emailField, nameField, btn, msg]);

    card.appendChild(form);
  }

  function renderBalanceForm(card) {
    var msgId = "lf-bal-msg";

    var emailField = h("div", { className: "lf-field" }, [
      h("label", { className: "lf-label", htmlFor: "lf-bal-email" }, "Email"),
      h("input", { className: "lf-input", id: "lf-bal-email", type: "email", placeholder: "you@example.com", value: state.balanceEmail, onInput: function (e) { state.balanceEmail = e.target.value; }})
    ]);

    var btn = h("button", { className: "lf-btn lf-btn-primary", type: "submit" }, "Check Balance");
    var msg = h("div", { className: "lf-msg", id: msgId });

    var form = h("form", { onSubmit: function (e) {
      e.preventDefault();
      if (!state.balanceEmail || !state.selectedProgram) return;
      btn.disabled = true;
      btn.textContent = "Checking...";

      fetch(API_BASE + "/api/public/orgs/" + orgSlug + "/programs/" + state.selectedProgram.id + "/balance?email=" + encodeURIComponent(state.balanceEmail), { headers: { "x-widget-secret": widgetSecret } })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data.error) {
            msg.className = "lf-msg lf-msg-err";
            msg.textContent = data.error;
          } else {
            msg.className = "lf-msg lf-msg-ok";
            msg.innerHTML = "";
            var box = h("div", { className: "lf-balance-box" });
            box.appendChild(h("div", { className: "lf-balance-num" }, String(data.balance || 0)));
            box.appendChild(h("div", { className: "lf-balance-label" }, "points"));
            if (data.tier) {
              box.appendChild(h("div", { className: "lf-tier" }, String(data.tier)));
            }
            msg.appendChild(box);
          }
          btn.disabled = false;
          btn.textContent = "Check Balance";
        })
        .catch(function () {
          msg.className = "lf-msg lf-msg-err";
          msg.textContent = "Something went wrong. Please try again.";
          btn.disabled = false;
          btn.textContent = "Check Balance";
        });
    }}, [emailField, btn, msg]);

    card.appendChild(form);
  }

  function fetchPrograms() {
    fetch(API_BASE + "/api/public/orgs/" + orgSlug + "/programs")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        state.programs = data.programs || [];
        state.loading = false;
        render();
      })
      .catch(function () {
        state.programs = [];
        state.loading = false;
        render();
      });
  }

  fetchPrograms();
})();
