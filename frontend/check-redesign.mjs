import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({channel:'msedge',headless:true});
try {
const page=await browser.newPage({viewport:{width:1440,height:1080}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:3000/');
await expect(page.getByRole('heading',{name:'A new perspective on our ocean.'})).toBeVisible();
await expect(page.getByRole('button',{name:'Load data',exact:true})).toBeEnabled({timeout:75000});
await page.screenshot({path:'dashboard-desktop.png'});
console.log('Desktop',JSON.stringify({errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}));
await page.getByRole('button',{name:'Ask Atlas about this area',exact:true}).click();
await expect(page.getByRole('heading',{name:'Ask Atlas',exact:true})).toBeVisible();
await expect(page.getByText('Exploring your selected area',{exact:true})).toBeVisible();
await page.screenshot({path:'atlas-chat.png'});
await page.getByRole('button',{name:'Research library',exact:true}).click();
await expect(page.getByRole('heading',{name:'Every insight starts with a source.'})).toBeVisible();
await expect(page.locator('.library-page').getByText(/Scientific knowledge library.*\d+ documents/)).toBeVisible({timeout:15000});
await page.screenshot({path:'atlas-library.png'});
await page.getByRole('button',{name:'Explore',exact:true}).click();
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'dashboard-mobile.png'});
await page.getByRole('button',{name:'Open Navigation Menu'}).click();
await page.getByRole('button',{name:'Ask Atlas',exact:true}).click();
await expect(page.getByRole('heading',{name:'Ask Atlas',exact:true})).toBeVisible();
console.log('Mobile',JSON.stringify({errors,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}));
} finally {await browser.close();}
