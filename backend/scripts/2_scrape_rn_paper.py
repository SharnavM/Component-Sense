import os
import requests
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright
import re
from urllib.parse import urlparse


ALL_COMPONENTS = {
  "ActivityIndicator": [
    "https://oss.callstack.com/react-native-paper/docs/components/ActivityIndicator"
  ],
  "Appbar": [
    "https://oss.callstack.com/react-native-paper/docs/components/Appbar/",
    "https://oss.callstack.com/react-native-paper/docs/components/Appbar/AppbarAction",
    "https://oss.callstack.com/react-native-paper/docs/components/Appbar/AppbarBackAction",
    "https://oss.callstack.com/react-native-paper/docs/components/Appbar/AppbarContent",
    "https://oss.callstack.com/react-native-paper/docs/components/Appbar/AppbarHeader"
  ],
  "Avatar": [
    "https://oss.callstack.com/react-native-paper/docs/components/Avatar/AvatarIcon",
    "https://oss.callstack.com/react-native-paper/docs/components/Avatar/AvatarImage",
    "https://oss.callstack.com/react-native-paper/docs/components/Avatar/AvatarText"
  ],
  "Badge": [
    "https://oss.callstack.com/react-native-paper/docs/components/Badge"
  ],
  "Banner": [
    "https://oss.callstack.com/react-native-paper/docs/components/Banner"
  ],
  "BottomNavigation": [
    "https://oss.callstack.com/react-native-paper/docs/components/BottomNavigation/",
    "https://oss.callstack.com/react-native-paper/docs/components/BottomNavigation/BottomNavigationBar"
  ],
  "Button": [
    "https://oss.callstack.com/react-native-paper/docs/components/Button/"
  ],
  "Card": [
    "https://oss.callstack.com/react-native-paper/docs/components/Card/",
    "https://oss.callstack.com/react-native-paper/docs/components/Card/CardActions",
    "https://oss.callstack.com/react-native-paper/docs/components/Card/CardContent",
    "https://oss.callstack.com/react-native-paper/docs/components/Card/CardCover",
    "https://oss.callstack.com/react-native-paper/docs/components/Card/CardTitle"
  ],
  "Checkbox": [
    "https://oss.callstack.com/react-native-paper/docs/components/Checkbox/",
    "https://oss.callstack.com/react-native-paper/docs/components/Checkbox/CheckboxAndroid",
    "https://oss.callstack.com/react-native-paper/docs/components/Checkbox/CheckboxIOS",
    "https://oss.callstack.com/react-native-paper/docs/components/Checkbox/CheckboxItem"
  ],
  "Chip": [
    "https://oss.callstack.com/react-native-paper/docs/components/Chip/"
  ],
  "DataTable": [
    "https://oss.callstack.com/react-native-paper/docs/components/DataTable/",
    "https://oss.callstack.com/react-native-paper/docs/components/DataTable/DataTableCell",
    "https://oss.callstack.com/react-native-paper/docs/components/DataTable/DataTableHeader",
    "https://oss.callstack.com/react-native-paper/docs/components/DataTable/DataTablePagination",
    "https://oss.callstack.com/react-native-paper/docs/components/DataTable/DataTableRow",
    "https://oss.callstack.com/react-native-paper/docs/components/DataTable/DataTableTitle"
  ],
  "Dialog": [
    "https://oss.callstack.com/react-native-paper/docs/components/Dialog/",
    "https://oss.callstack.com/react-native-paper/docs/components/Dialog/DialogActions",
    "https://oss.callstack.com/react-native-paper/docs/components/Dialog/DialogContent",
    "https://oss.callstack.com/react-native-paper/docs/components/Dialog/DialogIcon",
    "https://oss.callstack.com/react-native-paper/docs/components/Dialog/DialogScrollArea",
    "https://oss.callstack.com/react-native-paper/docs/components/Dialog/DialogTitle"
  ],
  "Divider": [
    "https://oss.callstack.com/react-native-paper/docs/components/Divider"
  ],
  "Drawer": [
    "https://oss.callstack.com/react-native-paper/docs/components/Drawer/DrawerCollapsedItem",
    "https://oss.callstack.com/react-native-paper/docs/components/Drawer/DrawerItem",
    "https://oss.callstack.com/react-native-paper/docs/components/Drawer/DrawerSection"
  ],
  "FAB": [
    "https://oss.callstack.com/react-native-paper/docs/components/FAB/",
    "https://oss.callstack.com/react-native-paper/docs/components/FAB/AnimatedFAB",
    "https://oss.callstack.com/react-native-paper/docs/components/FAB/FABGroup"
  ],
  "HelperText": [
    "https://oss.callstack.com/react-native-paper/docs/components/HelperText/"
  ],
  "Icon": [
    "https://oss.callstack.com/react-native-paper/docs/components/Icon"
  ],
  "IconButton": [
    "https://oss.callstack.com/react-native-paper/docs/components/IconButton/"
  ],
  "List": [
    "https://oss.callstack.com/react-native-paper/docs/components/List/ListAccordion",
    "https://oss.callstack.com/react-native-paper/docs/components/List/ListAccordionGroup",
    "https://oss.callstack.com/react-native-paper/docs/components/List/ListIcon",
    "https://oss.callstack.com/react-native-paper/docs/components/List/ListItem",
    "https://oss.callstack.com/react-native-paper/docs/components/List/ListSection",
    "https://oss.callstack.com/react-native-paper/docs/components/List/ListSubheader"
  ],
  "Menu": [
    "https://oss.callstack.com/react-native-paper/docs/components/Menu/",
    "https://oss.callstack.com/react-native-paper/docs/components/Menu/MenuItem"
  ],
  "Modal": [
    "https://oss.callstack.com/react-native-paper/docs/components/Modal"
  ],
  "Portal": [
    "https://oss.callstack.com/react-native-paper/docs/components/Portal/",
    "https://oss.callstack.com/react-native-paper/docs/components/Portal/PortalHost"
  ],
  "ProgressBar": [
    "https://oss.callstack.com/react-native-paper/docs/components/ProgressBar"
  ],
  "RadioButton": [
    "https://oss.callstack.com/react-native-paper/docs/components/RadioButton/",
    "https://oss.callstack.com/react-native-paper/docs/components/RadioButton/RadioButtonAndroid",
    "https://oss.callstack.com/react-native-paper/docs/components/RadioButton/RadioButtonGroup",
    "https://oss.callstack.com/react-native-paper/docs/components/RadioButton/RadioButtonIOS",
    "https://oss.callstack.com/react-native-paper/docs/components/RadioButton/RadioButtonItem"
  ],
  "Searchbar": [
    "https://oss.callstack.com/react-native-paper/docs/components/Searchbar"
  ],
  "SegmentedButtons": [
    "https://oss.callstack.com/react-native-paper/docs/components/SegmentedButtons/"
  ],
  "Snackbar": [
    "https://oss.callstack.com/react-native-paper/docs/components/Snackbar"
  ],
  "Surface": [
    "https://oss.callstack.com/react-native-paper/docs/components/Surface"
  ],
  "Switch": [
    "https://oss.callstack.com/react-native-paper/docs/components/Switch/"
  ],
  "Text": [
    "https://oss.callstack.com/react-native-paper/docs/components/Text/"
  ],
  "TextInput": [
    "https://oss.callstack.com/react-native-paper/docs/components/TextInput/",
    "https://oss.callstack.com/react-native-paper/docs/components/TextInput/TextInputAffix",
    "https://oss.callstack.com/react-native-paper/docs/components/TextInput/TextInputIcon"
  ],
  "ToggleButton": [
    "https://oss.callstack.com/react-native-paper/docs/components/ToggleButton/",
    "https://oss.callstack.com/react-native-paper/docs/components/ToggleButton/ToggleButtonGroup",
    "https://oss.callstack.com/react-native-paper/docs/components/ToggleButton/ToggleButtonRow"
  ],
  "Tooltip": [
    "https://oss.callstack.com/react-native-paper/docs/components/Tooltip/"
  ],
  "TouchableRipple": [
    "https://oss.callstack.com/react-native-paper/docs/components/TouchableRipple/"
  ]
}


def extract_components(url: str):
    path = urlparse(url).path.strip("/")
    parts = path.split("/")

    idx = parts.index("components")
    
    main_component = parts[idx + 1] if len(parts) > idx + 1 else None
    sub_component = parts[idx + 2] if len(parts) > idx + 2 else None

    return main_component, sub_component

def scrape_rn_paper(url, output_dir="docs_raw/rn-paper"):
    import markdownify

    component_slug, sub_component = extract_components(url)

    component_dir = os.path.join(output_dir, component_slug)
    os.makedirs(component_dir, exist_ok=True)
    
    print(f"Starting Playwright for {url}...")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, wait_until="networkidle")
        page.wait_for_timeout(1000)
        html = page.content()
        browser.close()

    # 1. Parse the hydrated HTML with BeautifulSoup
    soup = BeautifulSoup(html, 'html.parser')
    main_content = soup.find("div", class_='theme-doc-markdown')

    # Remove unnecessary stuff
    for selector in ["img"]:
        el = main_content.select_one(selector)
        if el:
            el.decompose()

    # 2. Convert the cleaned DOM to Markdown
    clean_markdown = markdownify.markdownify(str(main_content), heading_style="ATX", strip=['script', 'style', 'nav'])
    file_name = sub_component or component_slug
    file_path = os.path.join(component_dir, f"{file_name}.md")
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(clean_markdown)
    
    print(f"Successfully saved clean Markdown to {file_path}")

for component, urls in ALL_COMPONENTS.items():
  print("="*15)
  for u in urls:
      scrape_rn_paper(u)
