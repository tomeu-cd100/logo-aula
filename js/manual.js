export function filterPrimitives(list, query) {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(p => [p.nom, ...p.abreviatures].some(n => n.includes(q)));
}

export function groupByCategory(list) {
  const groups = new Map();
  for (const p of list) {
    if (!groups.has(p.categoria)) groups.set(p.categoria, []);
    groups.get(p.categoria).push(p);
  }
  return groups;
}

export function renderManual(container, list, onTry) {
  container.textContent = '';
  for (const [categoria, items] of groupByCategory(list)) {
    const section = document.createElement('section');
    section.className = 'manual-cat';
    const h3 = document.createElement('h3');
    h3.textContent = categoria;
    section.append(h3);
    for (const p of items) {
      const div = document.createElement('div');
      div.className = 'primitiva';
      const code = document.createElement('code');
      code.textContent = [p.nom, ...p.abreviatures].map(n => n.toUpperCase()).join(' · ');
      const sintaxi = document.createElement('div');
      sintaxi.textContent = p.sintaxi;
      const desc = document.createElement('p');
      desc.textContent = p.descripcio;
      const pre = document.createElement('pre');
      pre.textContent = p.exemple;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = 'Prova-ho';
      button.addEventListener('click', () => onTry(p.exemple));
      div.append(code, sintaxi, desc, pre, button);
      section.append(div);
    }
    container.append(section);
  }
}
