import os
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import re

def scrape_mui_interactive_guide(component_slug, output_dir="docs_raw/mui"):
    import markdownify

    url = f"https://mui.com/material-ui/react-{component_slug}/"
    component_dir = os.path.join(output_dir, component_slug)
    os.makedirs(component_dir, exist_ok=True)
    
    print(f"Starting Playwright for {url}...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")

        # 1. Find and click all "Show the source" buttons.
        # We use aria-labels because they are stable and don't change like hashed CSS classes.
        buttons = page.locator('[aria-label="demo source"] [data-ga-event-action="expand"]')
        count = buttons.count()
        print(f"Found {count} code blocks.")
        
        for i in range(count):
            try:
                buttons.nth(i).click()
            except Exception as e:
                print(f"Could not click button {i}: {e}")
        
        # Give the DOM a second to render the textareas
        page.wait_for_timeout(1000)
        html = page.content()
        browser.close()

    # 2. Parse the hydrated HTML with BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    main_content = soup.find('main')

    if not main_content:
        print("Could not find <main> tag.")
        return

    api_refs = main_content.select("h2#api")
    if not api_refs:
        api_refs = main_content.select("h2#api-2")

    if len(api_refs):
        api_links = [x.get("href") for x in api_refs[0].parent.select("ul a")]
    else:
        api_links = []

    # Remove unnecessary stuff
    for selector in ["p.description.ad", "ul", "nav", "footer"]:
        el = main_content.select_one(selector)
        if el:
            el.decompose()

    if api_refs:
        api_refs[0].parent.decompose()

    
    # 3. Extract the code and delete the interactive demo UI
    textareas = main_content.find_all('textarea', class_=lambda c: c and 'react-simple-code-editor' in c)
    
    for ta in textareas:
        raw_code = ta.get_text()
        
        # Create a clean standard HTML code block
        pre_tag = soup.new_tag('pre')
        code_tag = soup.new_tag('code')
        code_tag.string = raw_code
        pre_tag.append(code_tag)
        
        # Find the massive wrapper div that holds both the visual demo and the code editor.
        # We insert our clean <pre> tag right before it, then DESTROY the whole wrapper.
        # demo_container = ta.parent
        # for i in range(9): demo_container = demo_container.parent
        demo_container = ta.find_parent('div', class_=lambda c: c and 'css-190z8a7' in c)
        if demo_container:
            demo_container.insert_before(pre_tag)
            demo_container.decompose() # This deletes the "News", "Login", and the editor!

    # 4. Convert the cleaned DOM to Markdown
    clean_markdown = markdownify.markdownify(str(main_content), heading_style="ATX", strip=['script', 'style', 'nav'])
    
    file_path = os.path.join(component_dir, "guide_and_demos.md")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(clean_markdown)
    
    print(f"Successfully saved clean Markdown to {file_path}")

    for api in api_links:
      scrape_mui_component_api(f"https://mui.com{api}", component_slug) 

def scrape_mui_component_api(api_url, component, output_dir="docs_raw/mui"):
    from markdownify import markdownify as md

    # 1. Get Component Slug
    match = re.search(r'/api/([^/]+)/?', api_url)
    if match:
        component_slug = match.group(1)
    else:
        component_slug = ""
    
    # 2. Create the folder structure
    component_dir = os.path.join(output_dir, component)
    os.makedirs(component_dir, exist_ok=True)

    # 3. Helper function to fetch, parse, and save
    def process_page(url, filename):
        print(f"Fetching {url}...")
        response = requests.get(url)
        
        if response.status_code != 200:
            print(f"Failed to fetch {url}. Status: {response.status_code}")
            return

        # Parse with BeautifulSoup
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Isolate the main content area
        main_content = soup.find('main')

        for selector in ["nav", "footer", "h2#source-code + p", "h2#source-code"]:
            el = main_content.select_one(selector)
            if el:
                el.decompose()

        
        if not main_content:
            print(f"Could not find <main> tag on {url}")
            return
            
        # Convert the isolated HTML to Markdown
        # strip=['script', 'style', 'nav'] removes unwanted tags
        markdown_text = md(str(main_content), strip=['script', 'style', 'nav'], heading_style="ATX")
        
        # Save to file
        file_path = os.path.join(component_dir, filename)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(markdown_text)
        print(f"Saved {file_path}")

    # 4. Execute
    process_page(api_url, f"{component_slug}_api_reference.md")

def scrape_mui_component(component_slug):
  scrape_mui_interactive_guide(component_slug)

ALL_COMPONENTS = ['autocomplete', 'button', 'button-group', 'checkbox', 'floating-action-button',
                  'number-field', 'radio-button', 'rating', 'select', 'slider', 'switch', 'text-field',
                  'transfer-list', 'toggle-button', 'avatar', 'badge', 'chip', 'divider', 'icons',
                  'material-icons', 'list', 'table', 'tooltip', 'typography', 'alert', 'backdrop',
                  'dialog', 'progress', 'skeleton', 'snackbar', 'accordion', 'app-bar', 'card',
                  'paper', 'bottom-navigation', 'breadcrumbs', 'drawer', 'link', 'menu', 'pagination',
                  'speed-dial', 'stepper', 'tabs', 'box', 'container', 'grid', 'grid-legacy', 'stack',
                  'image-list', 'click-away-listener', 'css-baseline', 'init-color-scheme-script',
                  'modal', 'no-ssr', 'popover', 'popper', 'portal', 'textarea-autosize', 'transitions',
                  'use-media-query', 'data-grid', 'date-pickers', 'charts', 'tree-view', 'masonry',
                  'timeline']

for c in ALL_COMPONENTS:
  print("="*15)
  scrape_mui_component(c)
