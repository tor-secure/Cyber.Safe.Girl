import { type NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin" // Ensure firebase-admin is initialized

export async function GET(request: NextRequest) {
  try {
    // Extract chapterId from the query parameters
    const chapterId = request.nextUrl.searchParams.get('chapterId');
    
    console.log("Relevant Sections API GET - Chapter ID:", chapterId);

    if (!chapterId) {
      return NextResponse.json({ error: "Chapter ID is required" }, { status: 400 });
    }

    if (!adminDb) {
      console.error("Firebase admin is not initialized");
      return NextResponse.json({ error: "Database connection error" }, { status: 500 });
    }

    // Reference to the document containing the relevant sections for the chapter
    const relevantSectionsRef = adminDb.doc(`Relevant Sections/${chapterId}`);
    const relevantSectionsSnap = await relevantSectionsRef.get();

    // If relevant sections don't exist for this chapter, return a default message
    if (!relevantSectionsSnap.exists) {
      console.log("Relevant Sections API GET - Sections not found for chapter:", chapterId);
      
      // Return a default message
      return NextResponse.json({
        content: `No relevant sections found for chapter ${chapterId}. Please check back later.`
      });
    }

    const sectionsData = relevantSectionsSnap.data();
    
    // Check if we have IT_Sections_Applicable and other fields
    let formattedContent = "";
    
    // Format the content based on the available fields
    if (sectionsData) {
      // Add the name/title if available
      if (sectionsData.Name) {
        formattedContent += `${sectionsData.Name}\n\n`;
      }

      // Handle the specific structure shown in the example
      if (sectionsData["IT Sections Applicable"] && typeof sectionsData["IT Sections Applicable"] === 'object') {
        const itSectionsObj = sectionsData["IT Sections Applicable"];
        
        // Process each category in IT Sections Applicable
        Object.entries(itSectionsObj).forEach(([category, sections]) => {
          // Add the category as a header
          formattedContent += `${category}:\n`;
          
          // Process the sections
          if (Array.isArray(sections)) {
            sections.forEach((section: string) => {
              // Remove any brackets and clean up the text
              const cleanedSection = section.replace(/[\[\]"]/g, '');
              formattedContent += `${cleanedSection}\n`;
            });
          } else if (typeof sections === 'string') {
            const cleanedSection = sections.replace(/[\[\]"]/g, '');
            formattedContent += `${cleanedSection}\n`;
          }
          
          formattedContent += '\n';
        });
      }
      
      // Handle IT_Sections_Applicable (alternative naming)
      else if (sectionsData.IT_Sections_Applicable) {
        formattedContent += "IT Act Sections:\n";
        
        if (Array.isArray(sectionsData.IT_Sections_Applicable)) {
          sectionsData.IT_Sections_Applicable.forEach((section: any) => {
            if (typeof section === 'string') {
              // Remove any brackets and clean up the text
              const cleanedSection = section.replace(/[\[\]"]/g, '');
              formattedContent += `${cleanedSection}\n`;
            } else if (section && typeof section === 'object') {
              Object.entries(section).forEach(([key, value]) => {
                formattedContent += `${key} - ${value}\n`;
              });
            }
          });
        } else if (typeof sectionsData.IT_Sections_Applicable === 'object') {
          Object.entries(sectionsData.IT_Sections_Applicable).forEach(([key, value]) => {
            formattedContent += `${key}:\n`;
            
            if (Array.isArray(value)) {
              value.forEach((item: string) => {
                const cleanedItem = item.replace(/[\[\]"]/g, '');
                formattedContent += `${cleanedItem}\n`;
              });
            } else {
              formattedContent += `${value}\n`;
            }
          });
        }
        
        formattedContent += "\n";
      }
      
      // Handle IPC sections
      if (sectionsData.IPC_Sections) {
        formattedContent += "IPC Sections:\n";
        
        if (Array.isArray(sectionsData.IPC_Sections)) {
          sectionsData.IPC_Sections.forEach((section: any) => {
            if (typeof section === 'string') {
              // Remove any brackets and clean up the text
              const cleanedSection = section.replace(/[\[\]"]/g, '');
              formattedContent += `${cleanedSection}\n`;
            } else if (section && typeof section === 'object') {
              Object.entries(section).forEach(([key, value]) => {
                formattedContent += `${key} - ${value}\n`;
              });
            }
          });
        } else if (typeof sectionsData.IPC_Sections === 'object') {
          Object.entries(sectionsData.IPC_Sections).forEach(([key, value]) => {
            formattedContent += `${key}:\n`;
            
            if (Array.isArray(value)) {
              value.forEach((item: string) => {
                const cleanedItem = item.replace(/[\[\]"]/g, '');
                formattedContent += `${item}\n`;
              });
            } else {
              formattedContent += `${value}\n`;
            }
          });
        }
        
        formattedContent += "\n";
      }
      
      // Check for other sections or raw content
      if (sectionsData.content) {
        formattedContent += sectionsData.content;
      }
      
      // If no structured data is found, check for raw text content
      if (formattedContent.trim() === "" && sectionsData.text) {
        formattedContent = sectionsData.text;
      }
      
      // If still no content, format the raw data in a more readable way
      if (formattedContent.trim() === "") {
        // Instead of just stringifying, try to format it nicely
        Object.entries(sectionsData).forEach(([key, value]) => {
          if (key !== "Name") { // Skip name as it's already added at the top
            formattedContent += `${key}:\n`;
            
            if (typeof value === 'object' && value !== null) {
              if (Array.isArray(value)) {
                value.forEach((item: any) => {
                  if (typeof item === 'string') {
                    const cleanedItem = item.replace(/[\[\]"]/g, '');
                    formattedContent += `${cleanedItem}\n`;
                  } else if (typeof item === 'object') {
                    Object.entries(item).forEach(([subKey, subValue]) => {
                      formattedContent += `${subKey}: ${subValue}\n`;
                    });
                  }
                });
              } else {
                Object.entries(value).forEach(([subKey, subValue]) => {
                  formattedContent += `${subKey}:\n`;
                  
                  if (Array.isArray(subValue)) {
                    subValue.forEach((item: any) => {
                      if (typeof item === 'string') {
                        const cleanedItem = item.replace(/[\[\]"]/g, '');
                        formattedContent += `${cleanedItem}\n`;
                      }
                    });
                  } else {
                    formattedContent += `${subValue}\n`;
                  }
                });
              }
            } else {
              formattedContent += `${value}\n`;
            }
            
            formattedContent += '\n';
          }
        });
      }
    }

    return NextResponse.json({
      content: formattedContent || `No structured content found for chapter ${chapterId}.`
    });

  } catch (error) {
    console.error("Error fetching relevant sections:", error);
    return NextResponse.json({ error: "Failed to fetch relevant sections" }, { status: 500 });
  }
}