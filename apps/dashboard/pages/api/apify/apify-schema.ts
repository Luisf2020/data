// pages/api/apify-schema.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface SchemaField {
  key: string;
  description: string;
  value: string | null;
  isUserProvided: boolean;
  //type: string;
  //isOptional: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { owner, toolName } = req.query;
    const url = `https://apify.com/${owner}/${toolName}/input-schema`;

    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    // Find all input schema content divs
    const schemaFields: SchemaField[] = [];

    $('[data-test-id="input-schema-content"]').each((_, element) => {
      // Extract field name from the title
      const titleElement = $(element).find('.InputSchemaProperty-basicInfo span code').first();
      const field = titleElement.text();

      // Extract type
      const typeElement = $(element).find('.InputSchemaProperty-type');
      const type = typeElement.text();

      // Extract description
      const descriptionElement = $(element).find('.InputSchemaProperty-description p').first();
      const description = descriptionElement.text().trim();

      // Extract default value if exists
      const defaultValueElement = $(element).find('.kCxGAn code');
      const defaultValue = defaultValueElement.length ?
        defaultValueElement.text().replace(/^"(.*)"$/, '$1') : null;

      // Check if field is optional
      const isOptional = $(element).find('.InputSchemaProperty-basicInfo .bjseiT').text() === 'Optional';

      if (field) {
        schemaFields.push({
          key: field,
          description,
          value: "",
          isUserProvided: true
          //type,
          //isOptional
        });
      }
    });


    return res.status(200).json(schemaFields);
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Error fetching schema' });
  }
}