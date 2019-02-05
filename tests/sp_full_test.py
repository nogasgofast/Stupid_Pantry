#!/bin/python3


#test data
    data = {
      "SAM": [{
        "meal_count": 3,
        "meal_link": "Speggitty dinner",
        "meal_name": "Speggitty dinner"
        },{
        "meal_count": 2,
        "meal_link": "Bacon sandwhiches",
        "meal_name": "Bacon sandwhiches"
        },{
        "meal_count": 1,
        "meal_link": "Bacon speggitty dinner",
        "meal_name": "Bacon speggitty dinner"
        }],
      "SL": [{
        "ingredient_link":"pumpkin filling",
        "ingredient_name":"pumpkin filling",
        "ingredient_amount_max":"16",
        "ingredient_measure":"oz"
        },{
        "ingredient_link":"cheese slices",
        "ingredient_name":"cheese slices",
        "ingredient_amount_max":"24",
        "ingredient_measure":"count"
        },{
        "ingredient_link":"round buns",
        "ingredient_name":"round buns",
        "ingredient_amount_max":"6",
        "ingredient_measure":"count"
        }],
      "RM": [{
        "meal_count": 3,
        "meal_name": "Speggitty dinner",
        },{
        "meal_count": 2,
        "meal_name": "Bacon Sandwhiches",
        },{
        "meal_count": 1,
        "meal_name": "Bacon speggitty dinner"
        }],
      "CAM": [{
        "ingredient_link":"tomato",
        "ingredient_name":"tomato",
        "ingredient_amount_max":"",
        "ingredient_measure":"",
        "amount": 2,
        "meal_name": "burgers"
        },{
        "ingredient_link":"wieners",
        "ingredient_name":"wieners pack",
        "ingredient_amount_max": 8,
        "ingredient_measure":"ct",
        "amount": 8,
        "meal_name": "hotdogs"
        },{
        "ingredient_link":"tuna can",
        "ingredient_name":"tuna can",
        "ingredient_amount_max": 6,
        "ingredient_measure":"oz",
        "amount": 1,
        "meal_name": "tuna melt bowl"
        }],
      "PAN": [{
        "ingredient_name":"pumpkin filling",
        "ingredient_amount":"16",
        "ingredient_amount_max":"16",
        "ingredient_measure":"oz"
        },{
        "ingredient_name":"cheese slices",
        "ingredient_amount":"0",
        "ingredient_amount_max":"24",
        "ingredient_measure":"count"
        },{
        "ingredient_name":"round buns",
        "ingredient_amount":"0",
        "ingredient_amount_max":"6",
        "ingredient_measure":"count"
        }],
      "CKB": [{
        "meal_name": "spaghetti au gratain",
        "ING": [{
          "ingredient_name":"pasta",
          "ingredient_amount":"10",
          "ingredient_amount_max":"34",
          "ingredient_measure":"strands"
          },{
          "ingredient_name":"Olive Oil",
          "ingredient_amount":"2",
          "ingredient_amount_max":"16",
          "ingredient_measure":"oz"
          },{
          "ingredient_name":"potato",
          "ingredient_amount":"1",
          "ingredient_amount_max":"",
          "ingredient_measure":""
          }],
        "instructions": '<p>Chop your taters an cook them in an oven.</p><p>Boil your pasta in a pot until tender, about 10 mins</p>',
        "keep_stocked": True
        },{
        "meal_name": "aue gratain",
        "ING": [{
          "ingredient_name":"Olive Oil",
          "ingredient_amount":"2",
          "ingredient_amount_max":"16",
          "ingredient_measure":"oz"
          },{
          "ingredient_name":"potato",
          "ingredient_amount":"3",
          "ingredient_amount_max":"",
          "ingredient_measure":""
          },{
          "ingredient_name":"metal tub",
          "ingredient_amount":"1",
          "ingredient_amount_max":"",
          "ingredient_measure":""
          }],
        "instructions": '<p>Chop your taters an cook them in an oven.</p><p>Boil your toes, about 10 mins in salt water. Then towel dry to perfection</p>',
        "keep_stocked": False
        }]
    }
