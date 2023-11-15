# It takes 'page.revision_date_template' and process it like Liquid, and stores
# the result in 'page.revision_date_string'.
#
# 'page.revision_date_template' would have access to the variable 'revision_date'
# only.
class RevdateGenerator < Jekyll::Generator
  def generate(site)
    site.pages.each do |page|
      context = Liquid::Context.new
      context["revision_date"] = page.data["revision_date"]
      page.data["revision_date_string"] =
        Liquid::Template.parse(page.data["revision_date_template"]).render(context)
    end
  end
end
