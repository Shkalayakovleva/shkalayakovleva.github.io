/* Калькуляторы Шкалы Яковлева: обычный JS, без сторонних библиотек, ничего никуда не отправляют. */
(function () {
  var D = Math.PI / 180;
  function num(form, name) {
    var el = form.elements[name];
    if (!el) return NaN;
    var s = String(el.value).replace(/\s+/g, '').replace(',', '.');
    return s === '' ? NaN : Number(s);
  }
  function fmt(x, d) {
    if (!isFinite(x)) return '—';
    if (d === undefined) d = Math.abs(x) >= 100 ? 1 : Math.abs(x) >= 1 ? 3 : 4;
    try { return x.toLocaleString('ru-RU', { maximumFractionDigits: d }); }
    catch (e) { return String(+x.toFixed(d)).replace('.', ','); }
  }
  function sci(x) {
    if (!isFinite(x)) return '—';
    if (x === 0) return '0';
    if (x >= 1e-3 && x < 1e6) return fmt(x, 6);
    var e = Math.floor(Math.log(x) / Math.LN10), m = x / Math.pow(10, e);
    if (m >= 9.995) { m /= 10; e += 1; }
    return fmt(m, 2) + '·10<sup>' + e + '</sup>';
  }
  function err(t) { return '<span class="err">' + t + '</span>'; }
  function bind(id, fn) {
    var form = document.getElementById(id);
    if (!form) return;
    var out = form.querySelector('.out');
    function run() { out.innerHTML = fn(form); }
    form.addEventListener('input', run);
    form.addEventListener('change', run);
    form.addEventListener('submit', function (e) { e.preventDefault(); run(); });
    run();
  }

  // 1) Третья сторона по двум сторонам и углу между ними
  bind('calc-side', function (f) {
    var a = num(f, 'a'), b = num(f, 'b'), g = num(f, 'g');
    if (!(a > 0)) return err('Введите сторону a больше нуля.');
    if (!(g > 0 && g < 180)) return err('Угол между сторонами — от 0° до 180° (не включая).');
    var eq = !(b > 0); if (eq) b = a;
    var c = Math.sqrt(Math.max(0, a * a + b * b - 2 * a * b * Math.cos(g * D)));
    var k = Math.sin(g / 2 * D), est = (a + b) * k;
    var s = 'Третья сторона c = <b>' + fmt(c) + '</b>';
    if (eq) {
      s += '<br><span class="muted">Две равные стороны: c = 2a·sin(γ/2) = 2 × ' + fmt(a) + ' × ' + fmt(k, 4) + '.</span>';
    } else {
      s += '<br><span class="muted">Теорема косинусов: c = √(a² + b² − 2ab·cos γ). Оценка по шкале (a + b)·sin(γ/2) = ' +
        fmt(est) + ' (занижение ' + fmt((1 - est / c) * 100, 1) + '%).</span>';
    }
    return s;
  });

  // 2) Угол между сторонами по трём сторонам
  bind('calc-angle', function (f) {
    var a = num(f, 'a'), b = num(f, 'b'), c = num(f, 'c');
    if (!(a > 0) || !(c > 0)) return err('Введите стороны a и c больше нуля (b можно не вводить, если b = a).');
    var eq = !(b > 0); if (eq) b = a;
    if (c >= a + b || a >= b + c || b >= a + c) return err('Такого треугольника нет: каждая сторона должна быть меньше суммы двух других.');
    var cosg = (a * a + b * b - c * c) / (2 * a * b);
    var g = Math.acos(Math.max(-1, Math.min(1, cosg))) / D;
    var s = 'Угол между сторонами a и b: γ = <b>' + fmt(g, 2) + '°</b>';
    var A = Math.acos(Math.max(-1, Math.min(1, (b * b + c * c - a * a) / (2 * b * c)))) / D;
    s += '<br><span class="muted">Остальные углы: против a — ' + fmt(A, 2) + '°, против b — ' + fmt(180 - g - A, 2) + '°. ' +
      (eq ? 'Формула: γ = 2·arcsin(c / 2a).' : 'Формула: cos γ = (a² + b² − c²) / 2ab.') + '</span>';
    return s;
  });

  // 3) Хорда по радиусу (длине плеча) и углу; обратная задача — угол по хорде
  bind('calc-chord', function (f) {
    var r = num(f, 'r'), g = num(f, 'g'), L = num(f, 'L');
    if (!(r > 0)) return err('Введите радиус (длину плеча) больше нуля.');
    var s = '';
    if (g > 0 && g <= 360) {
      var c = 2 * r * Math.sin(g / 2 * D);
      s += 'Хорда для угла ' + fmt(g, 2) + '°: <b>' + fmt(c) + '</b>' +
        '<br><span class="muted">L = 2r·sin(α/2); дуга = ' + fmt(Math.PI * r * g / 180) + '.</span>';
    }
    if (L > 0) {
      if (L > 2 * r) s += (s ? '<br>' : '') + err('Хорда не может быть больше диаметра 2r = ' + fmt(2 * r) + '.');
      else s += (s ? '<br>' : '') + 'Угол по хорде ' + fmt(L) + ': <b>' + fmt(2 * Math.asin(L / (2 * r)) / D, 2) + '°</b>' +
        ' <span class="muted">(α = 2·arcsin(L / 2r))</span>';
    }
    return s || err('Введите угол или длину хорды.');
  });

  // 4) Деление окружности на n равных частей
  bind('calc-poly', function (f) {
    var r = num(f, 'r'), n = num(f, 'n');
    if (!(r > 0)) return err('Введите радиус больше нуля.');
    if (!(n >= 3 && n <= 1000 && Math.floor(n) === n)) return err('Число частей n — целое, от 3.');
    var c = 2 * r * Math.sin(Math.PI / n);
    return 'Раствор циркуля (сторона ' + n + '-угольника): <b>' + fmt(c) + '</b>' +
      '<br><span class="muted">L = 2R·sin(180° / n), центральный угол ' + fmt(360 / n, 3) + '°.</span>';
  });

  // 5) Скорость расхождения двух объектов
  bind('calc-diverge', function (f) {
    var v1 = num(f, 'v1'), v2 = num(f, 'v2'), g = num(f, 'g'), t = num(f, 't');
    if (!(v1 >= 0)) return err('Введите скорость первого объекта.');
    if (!(v2 >= 0)) v2 = v1;
    if (!(g >= 0 && g <= 180)) return err('Угол между курсами — от 0° до 180°.');
    var u = Math.sqrt(Math.max(0, v1 * v1 + v2 * v2 - 2 * v1 * v2 * Math.cos(g * D)));
    var s = 'Скорость расхождения u = <b>' + fmt(u) + '</b> (в тех же единицах, что и скорости)';
    if (t > 0) s += '<br>Расстояние через ' + fmt(t) + ' ч: <b>' + fmt(u * t) + '</b>';
    return s;
  });

  // 6) Замедление времени (СТО, только эффект скорости)
  bind('calc-dilation', function (f) {
    var v = num(f, 'v'), unit = f.elements.unit ? f.elements.unit.value : 'kmh';
    var C = 299792458;
    var ms = { kmh: 1 / 3.6, ms: 1, kms: 1000, c: C }[unit];
    if (!(v >= 0)) return err('Введите скорость.');
    var beta = v * ms / C;
    if (beta >= 1) return err('Скорость должна быть меньше скорости света.');
    var lag = -Math.expm1(0.5 * Math.log1p(-beta * beta));   // 1 − √(1 − β²) без потери точности
    var gam = 1 / Math.sqrt(1 - beta * beta);
    var day = lag * 86400, year = lag * 365.25 * 86400;
    function t(x) {
      if (x >= 86400) return fmt(x / 86400, 2) + ' сут';
      if (x >= 1) return fmt(x, 3) + ' с';
      if (x >= 1e-3) return fmt(x * 1e3, 3) + ' мс';
      if (x >= 1e-6) return fmt(x * 1e6, 3) + ' мкс';
      return fmt(x * 1e9, 3) + ' нс';
    }
    return 'Доля отставания Δt/t = <b>' + sci(lag) + '</b>' +
      '<br>За сутки часы отстают на <b>' + t(day) + '</b>, за год — на <b>' + t(year) + '</b>' +
      '<br><span class="muted">β = v/c = ' + sci(beta) + ', лоренц-фактор γ = ' + fmt(gam, gam < 1.001 ? 12 : 4) +
      ', ход часов √(1 − β²) = ' + fmt(1 / gam, 6) + '.</span>';
  });
})();
