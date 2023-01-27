# Find last page seen name

This code accepts the last page seen input field, called the Pages API by that slug, and return the title of the page.
The returned value is then assigned to a custom contact property.
This is useful to customize automated sales equence emails.

# mergeCompanis

The purpose of this code is to merge companies when there are duplicates without domain names that do have a contact with an email address. This can happen from botch imports or in cases where the same domain name is used with multiple contacts, but they work at different comany locations, such as contacts for schools inside school districts.

This code accepts the company record id and name. It searches for the company's first contact's domain name. Then it searches the CRM for other companies that have a matching name, then pulls those companies's first contact's domain name. Finally, it compares each found company and company contact domain to the original. If there is a match, the found company is merged with the original company.
