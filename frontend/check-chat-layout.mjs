import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 for(const width of [1440,390]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  let requests=0;
  await page.route('**/api/chat',route=>{
   requests++;
   return route.fulfill({json:{request_id:String(requests),status:requests===1?'unavailable':'ok',mode:'conversation',
    answer:requests===1?'The model took too long to answer. Please retry.':'Fish breathe through **gills**.\n\n- Water flows over the gills.\n- Oxygen enters the blood.',
    plan:{domains:[],scope:{},planner_mode:'rules'},citations:[],agents:[],limitations:[],follow_ups:[],visualizations:[],knowledge_graph:{},elapsed_ms:3}});
  });
  await page.goto('http://127.0.0.1:3000');
  if(width<640) await page.getByRole('button',{name:'Open Navigation Menu'}).click();
  await page.getByLabel('Ask Atlas',{exact:true}).click();
  const input=page.getByRole('textbox',{name:'Ask Atlas'});
  await input.fill('How do fish breathe?');
  await page.getByRole('button',{name:'Ask',exact:true}).click();
  await page.getByRole('button',{name:'Retry question'}).click();
  await expect(page.getByText('gills',{exact:true})).toBeVisible();
  await expect(page.getByRole('listitem').filter({hasText:'Water flows'})).toBeVisible();
  const box=await input.boundingBox();
  expect(box.y+box.height).toBeLessThanOrEqual(900);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:`../artifacts/chat-${width}.png`});
  console.log(`PASS ${width}px: normal reply, safe bold/list rendering, retry, composer in viewport, no horizontal overflow.`);
  await page.close();
 }
} finally {await browser.close();}
