CREATE TABLE "ingredient_categories" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ingredient_categories_name_lower_uniq" ON "ingredient_categories" USING btree (lower("name"));
--> statement-breakpoint
ALTER TABLE "ingredients" DROP COLUMN "category";
--> statement-breakpoint
ALTER TABLE "ingredients" ADD COLUMN "category_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_category_id_ingredient_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."ingredient_categories"("id") ON DELETE no action ON UPDATE no action;
