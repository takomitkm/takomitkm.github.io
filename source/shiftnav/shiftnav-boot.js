(function () {
  var BREAKPOINT = 1023;
  var ID = 'shiftnav-main';

  window.shiftnav_data = {
    breakpoint: String(BREAKPOINT),
    lock_body: 'off',
    lock_body_x: 'off',
    shift_body: '',
    shift_body_wrapper: '',
    scroll_offset: '120',
    scroll_panel: '.shiftnav-inner',
    scroll_tolerance: '120',
    scroll_top_boundary: '0',
    open_current: '',
    collapse_accordions: '',
    touch_off_close: 'on',
    close_on_target_click: 'on',
    disable_transforms: '',
    process_uber_segments: ''
  };

  function textOf(el) {
    if (!el) return '';
    return (el.textContent || '').trim();
  }

  function leafAnchors(menu) {
    return Array.prototype.slice.call(menu.querySelectorAll('.p-menu-items > a'));
  }

  function makeLeaf(a) {
    var li = document.createElement('li');
    li.className = 'menu-item shiftnav-depth-1';
    var link = document.createElement('a');
    link.className = 'shiftnav-target';
    link.href = a.getAttribute('href') || '#';
    link.innerHTML = a.innerHTML;
    var name = textOf(a.querySelector('.p-menu-items-name')) || textOf(a);
    if (name) {
      var span = document.createElement('span');
      span.className = 'p-menu-items-name';
      span.textContent = ' ' + name;
      link.appendChild(span);
    }
    li.appendChild(link);
    return li;
  }

  function buildMenu() {
    var groups = Array.prototype.slice.call(document.querySelectorAll('.p-menus .p-menu'));
    var ul = document.createElement('ul');
    ul.className = 'shiftnav-menu shiftnav-targets-medium shiftnav-targets-text-default '
      + 'shiftnav-targets-icon-default shiftnav-indent-subs shiftnav-active-on-hover '
      + 'shiftnav-active-highlight';

    if (groups.length === 1) {
      leafAnchors(groups[0]).forEach(function (a) {
        var li = makeLeaf(a);
        li.className = 'menu-item shiftnav-depth-0';
        ul.appendChild(li);
      });
      return ul;
    }

    groups.forEach(function (menu) {
      var caption = document.createElement('li');
      caption.className = 'menu-item menu-item-has-children shiftnav-sub-always shiftnav-depth-0';
      var head = document.createElement('a');
      head.className = 'shiftnav-target shiftnav-no-link';
      head.href = 'javascript:void(0);';
      var capText = textOf(menu.querySelector('.p-menu-caption span')) ||
        textOf(menu.querySelector('.p-menu-caption'));
      var capIcon = menu.querySelector('.p-menu-caption i');
      head.innerHTML = (capIcon ? capIcon.outerHTML : '') + '<span>' + capText + '</span>';
      caption.appendChild(head);

      var sub = document.createElement('ul');
      sub.className = 'sub-menu sub-menu-1';
      leafAnchors(menu).forEach(function (a) { sub.appendChild(makeLeaf(a)); });
      caption.appendChild(sub);
      ul.appendChild(caption);
    });
    return ul;
  }

  function mount() {
    var menu = buildMenu();
    if (!menu.children.length) return false;

    var drawer = document.createElement('div');
    drawer.className = 'shiftnav shiftnav-' + ID + ' shiftnav-left-edge '
      + 'shiftnav-skin-standard-dark shiftnav-transition-standard';
    drawer.id = ID;
    drawer.setAttribute('data-shiftnav-id', ID);
    drawer.setAttribute('role', 'navigation');
    drawer.innerHTML = '<div class="shiftnav-inner"><nav class="shiftnav-nav"></nav>'
      + '<button class="shiftnav-sr-close shiftnav-sr-only shiftnav-sr-only-focusable">'
      + '&times; Close Panel</button></div>';
    drawer.querySelector('.shiftnav-nav').appendChild(menu);
    document.body.appendChild(drawer);

    var toggle = document.createElement('button');
    toggle.id = 'shiftnav-toggle-main';
    toggle.className = 'shiftnav-toggle';
    toggle.setAttribute('data-shiftnav-target', ID);
    toggle.setAttribute('aria-controls', ID);
    toggle.setAttribute('aria-expanded', 'false');
    toggle.innerHTML = '<i class="fas fa-bars fa-fw"></i><span class="shiftnav-toggle-title"> 菜单</span>';
    document.body.appendChild(toggle);

    window.jQuery('#' + ID).shiftnav();
    return true;
  }

  function ready() {
    var names = Array.prototype.slice.call(document.querySelectorAll('.p-menus .p-menu-items-name'));
    if (!names.length) return false;
    return names.some(function (el) { return textOf(el) !== ''; });
  }

  function start() {
    if (!window.jQuery || typeof window.jQuery.fn.shiftnav !== 'function') return;
    var done = mount();
    if (done) return;
    var tries = 0;
    var timer = window.setInterval(function () {
      tries += 1;
      if (ready() && mount()) window.clearInterval(timer);
      else if (tries > 60) window.clearInterval(timer);
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
