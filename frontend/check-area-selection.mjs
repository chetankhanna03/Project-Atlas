import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({channel: 'msedge', headless: true});
try {
  for (const touch of [false, true]) {
    const context = await browser.newContext({viewport: touch ? {width: 390, height: 844} : {width: 1440, height: 1000}, hasTouch: touch, isMobile: touch});
    const page = await context.newPage();
    const requests = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/api/**', async route => {
      if (/argo\/gdac|biodiversity\/obis|erddap\/sst|fisheries\/effort/.test(route.request().url())) requests.push(new URL(route.request().url()));
      await route.fulfill({json: {status: 'no_data', profiles: [], results: [], data: [], total_apparent_fishing_hours: 0, limitations: []}});
    });
    await page.goto('http://127.0.0.1:3000/');
    const load = page.getByRole('button', {name: 'Load data', exact: true});
    await expect(load).toBeEnabled();
    await page.getByText('Dates & advanced filters', {exact: true}).click();
    const count = requests.length;
    await page.getByRole('button', {name: 'Bay of Bengal', exact: true}).click();
    await expect(page.getByRole('button', {name: 'Bay of Bengal', exact: true})).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('spinbutton', {name: 'west', exact: true})).toHaveValue('80');
    expect(requests.length).toBe(count);
    await page.getByRole('button', {name: 'Draw Area', exact: true}).click();
    const surface = page.getByLabel('Area drawing surface');
    await expect(surface).toBeVisible();
    await surface.scrollIntoViewIfNeeded();
    const b = await surface.boundingBox();
    const from = {x: b.x + b.width * .3, y: b.y + b.height * .45}, to = {x: b.x + b.width * .7, y: b.y + b.height * .75};
    const pane = page.locator('.leaflet-map-pane');
    const before = await pane.getAttribute('style');
    if (touch) {
      const cdp = await context.newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [from]});
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [to]});
      await cdp.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    } else {
      await page.mouse.move(from.x, from.y); await page.mouse.down();
      await page.mouse.move(to.x, to.y, {steps: 10}); await page.mouse.up();
    }
    await expect(surface).toHaveCount(0);
    await expect(page.locator('.leaflet-tooltip', {hasText: 'Selected area'})).toBeVisible();
    expect(await pane.getAttribute('style')).toBe(before);
    const coords = await Promise.all(['west','south','east','north'].map(name => page.getByRole('spinbutton', {name, exact: true}).inputValue()));
    expect(coords.map(Number)).not.toEqual([80,5,100,23]);
    expect(requests.length).toBe(count);
    const queryPanel = page.getByRole('region', {name: 'Data query', exact: true});
    await queryPanel.getByRole('checkbox', {name: 'Satellite SST', exact: true}).check();
    await queryPanel.getByRole('checkbox', {name: 'Fishing effort', exact: true}).check();
    await load.click();
    await expect(load).toBeEnabled();
    const selectedRequests = requests.slice(count);
    expect(selectedRequests).toHaveLength(4);
    expect(selectedRequests.filter(url => !url.pathname.includes('/sst')).every(url => url.searchParams.get('bbox') === coords.join(','))).toBe(true);
    const sst = selectedRequests.find(url => url.pathname.includes('/sst'));
    expect(Number(sst.searchParams.get('lat'))).toBe((Number(coords[1]) + Number(coords[3])) / 2);
    expect(Number(sst.searchParams.get('lon'))).toBe((Number(coords[0]) + Number(coords[2])) / 2);
    await page.getByRole('spinbutton', {name: 'west', exact: true}).fill(String(Number(coords[0]) + .1));
    await page.getByRole('button', {name: 'Clear Selection', exact: true}).click();
    await expect(page.getByRole('spinbutton', {name: 'west', exact: true})).toHaveValue(coords[0]);
    await expect(page.locator('.leaflet-tooltip', {hasText: 'Selected area'})).toHaveCount(0);
    await page.getByRole('button', {name: 'Use visible map area', exact: true}).click();
    await expect(page.locator('.leaflet-tooltip', {hasText: 'Selected area'})).toBeVisible();
    const afterLoad = requests.length;
    await page.getByRole('button', {name: 'Draw Area', exact: true}).click();
    await page.keyboard.press('Escape');
    await expect(surface).toHaveCount(0);
    const panBefore = await pane.getAttribute('style');
    await page.locator('.leaflet-container').focus();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => pane.getAttribute('style')).not.toBe(panBefore);
    expect(requests.length).toBe(afterLoad);
    expect(errors).toEqual([]);
    await page.getByRole('region', {name: 'Ocean map', exact: true}).screenshot({path: `area-${touch ? 'touch' : 'mouse'}.png`});
    console.log(`${touch ? 'Touch' : 'Mouse'}: draw, no pan, coordinates, explicit load, reset, visible area, cancel passed`);
    await context.close();
  }
} finally { await browser.close(); }
