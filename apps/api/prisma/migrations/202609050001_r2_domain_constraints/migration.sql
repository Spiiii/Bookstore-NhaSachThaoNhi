BEGIN;

LOCK TABLE public.categories, public.brands, public.products, public.product_images,
  public.product_attributes, public.product_marketplace_links, public.news, public.banners
  IN ACCESS EXCLUSIVE MODE;

ALTER TABLE public.categories
  ADD CONSTRAINT categories_name_check CHECK (btrim(name) <> ''),
  ADD CONSTRAINT categories_slug_check CHECK (
    slug <> '' AND slug = lower(btrim(slug)) AND octet_length(slug) = char_length(slug)
  ),
  ADD CONSTRAINT categories_sort_order_check CHECK (sort_order >= 0),
  ADD CONSTRAINT categories_parent_check CHECK (parent_id IS NULL OR parent_id <> id);

ALTER TABLE public.brands
  ADD CONSTRAINT brands_name_check CHECK (btrim(name) <> ''),
  ADD CONSTRAINT brands_slug_check CHECK (
    slug <> '' AND slug = lower(btrim(slug)) AND octet_length(slug) = char_length(slug)
  );

ALTER TABLE public.products
  ADD CONSTRAINT products_sku_check CHECK (
    sku <> '' AND sku = upper(btrim(sku)) AND octet_length(sku) = char_length(sku)
  ),
  ADD CONSTRAINT products_name_check CHECK (btrim(name) <> ''),
  ADD CONSTRAINT products_slug_check CHECK (
    slug <> '' AND slug = lower(btrim(slug)) AND octet_length(slug) = char_length(slug)
  ),
  ADD CONSTRAINT products_reference_price_check CHECK (
    reference_price IS NULL OR reference_price >= 0
  ),
  ADD CONSTRAINT products_currency_check CHECK (currency = 'VND');

ALTER TABLE public.product_images
  ADD CONSTRAINT product_images_storage_key_check CHECK (btrim(storage_key) <> ''),
  ADD CONSTRAINT product_images_sort_order_check CHECK (sort_order >= 0);

ALTER TABLE public.product_attributes
  ADD CONSTRAINT product_attributes_key_check CHECK (
    key <> '' AND key = lower(btrim(key)) AND octet_length(key) = char_length(key)
  ),
  ADD CONSTRAINT product_attributes_label_check CHECK (btrim(label) <> ''),
  ADD CONSTRAINT product_attributes_value_check CHECK (btrim(value) <> ''),
  ADD CONSTRAINT product_attributes_sort_order_check CHECK (sort_order >= 0);

ALTER TABLE public.product_marketplace_links
  ADD CONSTRAINT product_marketplace_links_url_check CHECK (btrim(url) <> '');

ALTER TABLE public.news
  ADD CONSTRAINT news_title_check CHECK (btrim(title) <> ''),
  ADD CONSTRAINT news_slug_check CHECK (
    slug <> '' AND slug = lower(btrim(slug)) AND octet_length(slug) = char_length(slug)
  ),
  ADD CONSTRAINT news_content_check CHECK (btrim(content) <> '');

ALTER TABLE public.banners
  ADD CONSTRAINT banners_title_check CHECK (btrim(title) <> ''),
  ADD CONSTRAINT banners_image_key_check CHECK (btrim(image_key) <> ''),
  ADD CONSTRAINT banners_placement_check CHECK (btrim(placement) <> ''),
  ADD CONSTRAINT banners_sort_order_check CHECK (sort_order >= 0);

COMMIT;
