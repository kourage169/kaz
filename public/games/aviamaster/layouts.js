const layouts = {
    layout1: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 403, y: 364, value: 3, type: 'add' },
        { x: 754, y: 122, value: 3, type: 'mult' },
        { x: 218, y: 174, value: 2, type: 'mult' },
        { x: 837, y: 443, value: 2, type: 'mult' },
        { x: 788, y: 314, value: 3, type: 'add' },
        { x: 730, y: 392, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 246, y: 434 },
        { x: 451, y: 187 },
        { x: 639, y: 356 },
        { x: 351, y: 127 },
        { x: 548, y: 118 },
      ]
    },
    layout2: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 535, y: 231, value: 2, type: 'add' },
        { x: 257, y: 140, value: 2, type: 'mult' },
        { x: 288, y: 288, value: 2, type: 'mult' },
        { x: 70, y: 400, value: 5, type: 'add' },
        { x: 814, y: 91, value: 2, type: 'add' },
        { x: 282, y: 234, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 547, y: 79 },
        { x: 109, y: 341 },
        { x: 89, y: 82 },
        { x: 883, y: 214 },
        { x: 775, y: 50 },
      ]
    },
    layout3: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 573, y: 358, value: 1, type: 'add' },
        { x: 339, y: 218, value: 2, type: 'add' },
        { x: 202, y: 430, value: 2, type: 'mult' },
        { x: 133, y: 123, value: 2, type: 'mult' },
        { x: 445, y: 250, value: 2, type: 'mult' },
        { x: 648, y: 154, value: 4, type: 'add' },
      ],
      rockets: [
        { x: 842, y: 349 },
        { x: 734, y: 139 },
        { x: 111, y: 342 },
        { x: 352, y: 437 },
        { x: 702, y: 441 },
      ]
    },
    layout4: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 610, y: 140, value: 2, type: 'mult' },
        { x: 400, y: 202, value: 5, type: 'mult' },
        { x: 539, y: 329, value: 2, type: 'add' },
        { x: 748, y: 77, value: 2, type: 'add' },
        { x: 758, y: 157, value: 3, type: 'mult' },
        { x: 910, y: 79, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 772, y: 231 },
        { x: 261, y: 269 },
        { x: 687, y: 156 },
        { x: 916, y: 176 },
        { x: 123, y: 318 },
      ]
    },
    layout5: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 209, y: 387, value: 1, type: 'add' },
        { x: 722, y: 408, value: 4, type: 'mult' },
        { x: 618, y: 285, value: 2, type: 'mult' },
        { x: 330, y: 300, value: 3, type: 'mult' },
        { x: 906, y: 271, value: 5, type: 'mult' },
        { x: 513, y: 68, value: 4, type: 'mult' },
      ],
      rockets: [
        { x: 887, y: 388 },
        { x: 885, y: 57 },
        { x: 520, y: 202 },
        { x: 199, y: 97 },
        { x: 430, y: 445 },
      ]
    },
    layout6: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 290, y: 378, value: 3, type: 'mult' },
        { x: 851, y: 381, value: 4, type: 'mult' },
        { x: 617, y: 424, value: 10, type: 'add' },
        { x: 222, y: 382, value: 2, type: 'add' },
        { x: 750, y: 243, value: 5, type: 'add' },
        { x: 940, y: 229, value: 5, type: 'mult' },
      ],
      rockets: [
        { x: 451, y: 326 },
        { x: 151, y: 234 },
        { x: 379, y: 449 },
        { x: 362, y: 126 },
        { x: 347, y: 389 },
      ]
    },
    layout7: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 889, y: 117, value: 2, type: 'mult' },
        { x: 515, y: 237, value: 2, type: 'mult' },
        { x: 922, y: 394, value: 2, type: 'add' },
        { x: 306, y: 393, value: 2, type: 'mult' },
        { x: 363, y: 303, value: 3, type: 'mult' },
        { x: 624, y: 176, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 667, y: 253 },
        { x: 831, y: 376 },
        { x: 669, y: 324 },
        { x: 110, y: 315 },
        { x: 820, y: 450 },
      ]
    },
    layout8: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 592, y: 177, value: 2, type: 'mult' },
        { x: 185, y: 114, value: 2, type: 'mult' },
        { x: 167, y: 181, value: 4, type: 'mult' },
        { x: 852, y: 53, value: 2, type: 'add' },
        { x: 280, y: 88, value: 1, type: 'add' },
        { x: 356, y: 205, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 582, y: 266 },
        { x: 752, y: 344 },
        { x: 526, y: 217 },
        { x: 645, y: 312 },
        { x: 428, y: 114 },
      ]
    },
    layout9: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 665, y: 237, value: 10, type: 'add' },
        { x: 532, y: 226, value: 4, type: 'mult' },
        { x: 76, y: 363, value: 2, type: 'mult' },
        { x: 340, y: 354, value: 3, type: 'mult' },
        { x: 947, y: 88, value: 3, type: 'mult' },
        { x: 516, y: 174, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 401, y: 218 },
        { x: 251, y: 76 },
        { x: 208, y: 272 },
        { x: 361, y: 188 },
        { x: 311, y: 67 },
      ]
    },
    layout10: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 889, y: 184, value: 3, type: 'mult' },
        { x: 131, y: 357, value: 4, type: 'add' },
        { x: 719, y: 167, value: 3, type: 'add' },
        { x: 886, y: 398, value: 5, type: 'mult' },
        { x: 67, y: 275, value: 2, type: 'mult' },
        { x: 365, y: 249, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 614, y: 440 },
        { x: 688, y: 105 },
        { x: 181, y: 282 },
        { x: 466, y: 294 },
        { x: 125, y: 178 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 11-20 ////////////////////
    
    layout11: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 525, y: 430, value: 4, type: 'mult' },
        { x: 694, y: 208, value: 3, type: 'add' },
        { x: 397, y: 450, value: 10, type: 'add' },
        { x: 102, y: 199, value: 1, type: 'add' },
        { x: 779, y: 205, value: 2, type: 'mult' },
        { x: 829, y: 298, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 799, y: 416 },
        { x: 583, y: 447 },
        { x: 529, y: 233 },
        { x: 833, y: 176 },
        { x: 651, y: 352 },
      ]
    },
    layout12: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 888, y: 259, value: 2, type: 'mult' },
        { x: 714, y: 344, value: 3, type: 'add' },
        { x: 141, y: 114, value: 3, type: 'add' },
        { x: 302, y: 106, value: 2, type: 'mult' },
        { x: 129, y: 381, value: 2, type: 'mult' },
        { x: 480, y: 132, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 288, y: 418 },
        { x: 791, y: 266 },
        { x: 494, y: 66 },
        { x: 686, y: 123 },
        { x: 609, y: 94 },
      ]
    },
    layout13: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 428, y: 257, value: 1, type: 'add' },
        { x: 832, y: 291, value: 2, type: 'add' },
        { x: 90, y: 398, value: 2, type: 'mult' },
        { x: 848, y: 139, value: 5, type: 'mult' },
        { x: 245, y: 404, value: 2, type: 'add' },
        { x: 557, y: 367, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 675, y: 216 },
        { x: 604, y: 247 },
        { x: 80, y: 162 },
        { x: 307, y: 77 },
        { x: 862, y: 187 },
      ]
    },
    layout14: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 781, y: 146, value: 2, type: 'add' },
        { x: 63, y: 336, value: 2, type: 'mult' },
        { x: 389, y: 203, value: 4, type: 'mult' },
        { x: 505, y: 105, value: 2, type: 'mult' },
        { x: 69, y: 65, value: 3, type: 'add' },
        { x: 733, y: 360, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 436, y: 404 },
        { x: 777, y: 417 },
        { x: 743, y: 235 },
        { x: 270, y: 411 },
        { x: 941, y: 396 },
      ]
    },
    layout15: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 920, y: 115, value: 2, type: 'mult' },
        { x: 243, y: 405, value: 5, type: 'mult' },
        { x: 359, y: 284, value: 2, type: 'mult' },
        { x: 155, y: 314, value: 2, type: 'add' },
        { x: 378, y: 160, value: 10, type: 'mult' },
        { x: 73, y: 110, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 92, y: 434 },
        { x: 503, y: 256 },
        { x: 552, y: 380 },
        { x: 871, y: 239 },
        { x: 363, y: 419 },
      ]
    },
    layout16: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 829, y: 63, value: 1, type: 'add' },
        { x: 542, y: 320, value: 3, type: 'mult' },
        { x: 909, y: 419, value: 4, type: 'mult' },
        { x: 583, y: 157, value: 3, type: 'add' },
        { x: 674, y: 450, value: 4, type: 'mult' },
        { x: 476, y: 53, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 909, y: 153 },
        { x: 82, y: 396 },
        { x: 472, y: 422 },
        { x: 477, y: 184 },
        { x: 517, y: 122 },
      ]
    },
    layout17: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 389, y: 147, value: 2, type: 'add' },
        { x: 557, y: 425, value: 2, type: 'add' },
        { x: 860, y: 165, value: 3, type: 'add' },
        { x: 66, y: 249, value: 4, type: 'mult' },
        { x: 76, y: 114, value: 2, type: 'mult' },
        { x: 90, y: 415, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 326, y: 67 },
        { x: 586, y: 198 },
        { x: 640, y: 153 },
        { x: 764, y: 108 },
        { x: 648, y: 60 },
      ]
    },
    layout18: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 229, y: 343, value: 1, type: 'add' },
        { x: 772, y: 312, value: 2, type: 'mult' },
        { x: 341, y: 181, value: 4, type: 'add' },
        { x: 565, y: 428, value: 2, type: 'add' },
        { x: 109, y: 430, value: 3, type: 'add' },
        { x: 588, y: 130, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 894, y: 189 },
        { x: 460, y: 324 },
        { x: 485, y: 84 },
        { x: 416, y: 267 },
        { x: 69, y: 127 },
      ]
    },
    layout19: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 708, y: 258, value: 1, type: 'add' },
        { x: 429, y: 307, value: 1, type: 'add' },
        { x: 323, y: 326, value: 2, type: 'add' },
        { x: 944, y: 119, value: 5, type: 'add' },
        { x: 95, y: 236, value: 5, type: 'mult' },
        { x: 818, y: 133, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 675, y: 86 },
        { x: 605, y: 362 },
        { x: 76, y: 297 },
        { x: 150, y: 91 },
        { x: 608, y: 258 },
      ]
    },
    layout20: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 574, y: 145, value: 3, type: 'mult' },
        { x: 754, y: 102, value: 1, type: 'add' },
        { x: 62, y: 241, value: 5, type: 'mult' },
        { x: 280, y: 159, value: 1, type: 'add' },
        { x: 873, y: 416, value: 2, type: 'mult' },
        { x: 198, y: 81, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 441, y: 344 },
        { x: 214, y: 215 },
        { x: 602, y: 373 },
        { x: 460, y: 71 },
        { x: 732, y: 55 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 21-30 ////////////////////
    layout21: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 473, y: 233, value: 5, type: 'add' },
        { x: 437, y: 366, value: 1, type: 'add' },
        { x: 941, y: 101, value: 5, type: 'add' },
        { x: 492, y: 306, value: 2, type: 'mult' },
        { x: 176, y: 233, value: 3, type: 'add' },
        { x: 436, y: 139, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 309, y: 149 },
        { x: 102, y: 418 },
        { x: 322, y: 287 },
        { x: 366, y: 408 },
        { x: 217, y: 190 },
      ]
    },
    layout22: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 293, y: 257, value: 2, type: 'mult' },
        { x: 637, y: 426, value: 3, type: 'add' },
        { x: 414, y: 223, value: 10, type: 'mult' },
        { x: 285, y: 360, value: 1, type: 'add' },
        { x: 921, y: 318, value: 3, type: 'mult' },
        { x: 907, y: 144, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 472, y: 228 },
        { x: 107, y: 281 },
        { x: 874, y: 68 },
        { x: 727, y: 341 },
        { x: 922, y: 405 },
      ]
    },
    layout23: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 348, y: 317, value: 1, type: 'add' },
        { x: 829, y: 306, value: 10, type: 'add' },
        { x: 578, y: 327, value: 2, type: 'mult' },
        { x: 539, y: 389, value: 1, type: 'add' },
        { x: 675, y: 425, value: 3, type: 'add' },
        { x: 509, y: 191, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 670, y: 239 },
        { x: 564, y: 165 },
        { x: 915, y: 303 },
        { x: 74, y: 162 },
        { x: 837, y: 61 },
      ]
    },
    layout24: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 641, y: 329, value: 1, type: 'add' },
        { x: 481, y: 155, value: 2, type: 'mult' },
        { x: 617, y: 226, value: 5, type: 'add' },
        { x: 173, y: 269, value: 2, type: 'add' },
        { x: 820, y: 114, value: 5, type: 'add' },
        { x: 257, y: 356, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 239, y: 273 },
        { x: 749, y: 144 },
        { x: 634, y: 112 },
        { x: 347, y: 407 },
        { x: 627, y: 433 },
      ]
    },
    layout25: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 894, y: 390, value: 3, type: 'mult' },
        { x: 116, y: 206, value: 5, type: 'add' },
        { x: 790, y: 226, value: 1, type: 'add' },
        { x: 156, y: 386, value: 2, type: 'mult' },
        { x: 240, y: 329, value: 3, type: 'add' },
        { x: 297, y: 292, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 169, y: 104 },
        { x: 400, y: 90 },
        { x: 576, y: 420 },
        { x: 903, y: 227 },
        { x: 898, y: 146 },
      ]
    },
    layout26: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 381, y: 249, value: 2, type: 'add' },
        { x: 297, y: 437, value: 3, type: 'mult' },
        { x: 482, y: 276, value: 1, type: 'add' },
        { x: 652, y: 69, value: 4, type: 'mult' },
        { x: 244, y: 171, value: 3, type: 'mult' },
        { x: 270, y: 390, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 858, y: 313 },
        { x: 692, y: 427 },
        { x: 390, y: 366 },
        { x: 448, y: 356 },
        { x: 80, y: 111 },
      ]
    },
    layout27: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 226, y: 225, value: 4, type: 'add' },
        { x: 526, y: 196, value: 3, type: 'mult' },
        { x: 674, y: 113, value: 2, type: 'mult' },
        { x: 530, y: 95, value: 3, type: 'add' },
        { x: 548, y: 310, value: 3, type: 'add' },
        { x: 85, y: 202, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 933, y: 402 },
        { x: 401, y: 235 },
        { x: 289, y: 404 },
        { x: 54, y: 304 },
        { x: 281, y: 311 },
      ]
    },
    layout28: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 532, y: 337, value: 2, type: 'mult' },
        { x: 495, y: 410, value: 1, type: 'add' },
        { x: 631, y: 237, value: 4, type: 'mult' },
        { x: 574, y: 193, value: 3, type: 'mult' },
        { x: 905, y: 221, value: 2, type: 'mult' },
        { x: 824, y: 65, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 269, y: 235 },
        { x: 206, y: 174 },
        { x: 486, y: 307 },
        { x: 363, y: 416 },
        { x: 744, y: 420 },
      ]
    },
    layout29: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 752, y: 184, value: 5, type: 'mult' },
        { x: 151, y: 315, value: 4, type: 'add' },
        { x: 84, y: 350, value: 3, type: 'mult' },
        { x: 822, y: 191, value: 3, type: 'mult' },
        { x: 867, y: 88, value: 2, type: 'add' },
        { x: 429, y: 86, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 586, y: 109 },
        { x: 554, y: 318 },
        { x: 838, y: 381 },
        { x: 657, y: 193 },
        { x: 462, y: 185 },
      ]
    },
    layout30: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 297, y: 191, value: 10, type: 'mult' },
        { x: 632, y: 422, value: 3, type: 'mult' },
        { x: 513, y: 144, value: 2, type: 'mult' },
        { x: 463, y: 84, value: 2, type: 'mult' },
        { x: 851, y: 437, value: 3, type: 'mult' },
        { x: 191, y: 408, value: 4, type: 'add' },
      ],
      rockets: [
        { x: 572, y: 234 },
        { x: 748, y: 196 },
        { x: 311, y: 416 },
        { x: 920, y: 407 },
        { x: 67, y: 272 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 31-40 ////////////////////
    layout31: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 727, y: 296, value: 5, type: 'mult' },
        { x: 262, y: 147, value: 10, type: 'add' },
        { x: 370, y: 159, value: 3, type: 'add' },
        { x: 745, y: 388, value: 5, type: 'mult' },
        { x: 136, y: 96, value: 5, type: 'add' },
        { x: 524, y: 450, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 90, y: 54 },
        { x: 919, y: 166 },
        { x: 803, y: 367 },
        { x: 660, y: 405 },
        { x: 170, y: 386 },
      ]
    },
    layout32: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 50, y: 182, value: 4, type: 'mult' },
        { x: 743, y: 318, value: 3, type: 'mult' },
        { x: 186, y: 242, value: 1, type: 'add' },
        { x: 288, y: 82, value: 1, type: 'add' },
        { x: 399, y: 317, value: 2, type: 'add' },
        { x: 264, y: 442, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 645, y: 258 },
        { x: 551, y: 262 },
        { x: 664, y: 71 },
        { x: 852, y: 316 },
        { x: 171, y: 160 },
      ]
    },
    layout33: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 424, y: 388, value: 2, type: 'mult' },
        { x: 690, y: 223, value: 2, type: 'mult' },
        { x: 104, y: 407, value: 10, type: 'mult' },
        { x: 393, y: 159, value: 5, type: 'add' },
        { x: 301, y: 447, value: 1, type: 'add' },
        { x: 66, y: 171, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 580, y: 149 },
        { x: 93, y: 278 },
        { x: 241, y: 83 },
        { x: 361, y: 372 },
        { x: 887, y: 405 },
      ]
    },
    layout34: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 359, y: 319, value: 2, type: 'mult' },
        { x: 653, y: 344, value: 3, type: 'mult' },
        { x: 113, y: 255, value: 10, type: 'add' },
        { x: 92, y: 206, value: 3, type: 'mult' },
        { x: 425, y: 199, value: 1, type: 'add' },
        { x: 522, y: 383, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 210, y: 240 },
        { x: 86, y: 389 },
        { x: 457, y: 108 },
        { x: 494, y: 210 },
        { x: 754, y: 124 },
      ]
    },
    layout35: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 541, y: 105, value: 2, type: 'mult' },
        { x: 298, y: 105, value: 1, type: 'add' },
        { x: 184, y: 292, value: 3, type: 'add' },
        { x: 906, y: 307, value: 10, type: 'mult' },
        { x: 635, y: 321, value: 3, type: 'add' },
        { x: 349, y: 140, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 85, y: 186 },
        { x: 478, y: 127 },
        { x: 885, y: 396 },
        { x: 517, y: 356 },
        { x: 817, y: 284 },
      ]
    },
    layout36: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 503, y: 315, value: 2, type: 'mult' },
        { x: 248, y: 263, value: 4, type: 'mult' },
        { x: 114, y: 427, value: 4, type: 'mult' },
        { x: 939, y: 120, value: 1, type: 'add' },
        { x: 452, y: 348, value: 2, type: 'mult' },
        { x: 785, y: 238, value: 5, type: 'mult' },
      ],
      rockets: [
        { x: 436, y: 205 },
        { x: 317, y: 256 },
        { x: 108, y: 245 },
        { x: 895, y: 272 },
        { x: 198, y: 87 },
      ]
    },
    layout37: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 659, y: 123, value: 3, type: 'mult' },
        { x: 332, y: 379, value: 2, type: 'mult' },
        { x: 216, y: 183, value: 3, type: 'mult' },
        { x: 94, y: 279, value: 3, type: 'mult' },
        { x: 511, y: 329, value: 2, type: 'add' },
        { x: 690, y: 341, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 661, y: 57 },
        { x: 591, y: 205 },
        { x: 470, y: 437 },
        { x: 139, y: 100 },
        { x: 57, y: 444 },
      ]
    },
    layout38: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 300, y: 391, value: 3, type: 'mult' },
        { x: 90, y: 236, value: 4, type: 'add' },
        { x: 349, y: 58, value: 4, type: 'add' },
        { x: 103, y: 310, value: 5, type: 'mult' },
        { x: 510, y: 176, value: 3, type: 'mult' },
        { x: 782, y: 441, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 937, y: 226 },
        { x: 945, y: 80 },
        { x: 618, y: 141 },
        { x: 815, y: 296 },
        { x: 877, y: 388 },
      ]
    },
    layout39: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 373, y: 294, value: 4, type: 'mult' },
        { x: 252, y: 237, value: 1, type: 'add' },
        { x: 540, y: 351, value: 3, type: 'mult' },
        { x: 637, y: 85, value: 1, type: 'add' },
        { x: 403, y: 364, value: 3, type: 'add' },
        { x: 747, y: 380, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 68, y: 406 },
        { x: 729, y: 298 },
        { x: 658, y: 263 },
        { x: 890, y: 165 },
        { x: 58, y: 221 },
      ]
    },
    layout40: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 409, y: 124, value: 2, type: 'mult' },
        { x: 398, y: 427, value: 1, type: 'add' },
        { x: 403, y: 218, value: 10, type: 'add' },
        { x: 946, y: 307, value: 2, type: 'add' },
        { x: 536, y: 395, value: 1, type: 'add' },
        { x: 77, y: 230, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 639, y: 324 },
        { x: 247, y: 187 },
        { x: 921, y: 151 },
        { x: 655, y: 83 },
        { x: 377, y: 333 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 41-50 ////////////////////
  
    layout41: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 911, y: 432, value: 3, type: 'mult' },
        { x: 645, y: 194, value: 3, type: 'mult' },
        { x: 116, y: 256, value: 1, type: 'add' },
        { x: 865, y: 126, value: 2, type: 'mult' },
        { x: 662, y: 437, value: 2, type: 'mult' },
        { x: 585, y: 144, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 729, y: 149 },
        { x: 475, y: 62 },
        { x: 513, y: 346 },
        { x: 654, y: 377 },
        { x: 786, y: 346 },
      ]
    },
    layout42: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 601, y: 436, value: 3, type: 'mult' },
        { x: 505, y: 329, value: 5, type: 'add' },
        { x: 865, y: 328, value: 4, type: 'add' },
        { x: 705, y: 181, value: 1, type: 'add' },
        { x: 81, y: 381, value: 2, type: 'add' },
        { x: 909, y: 276, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 887, y: 92 },
        { x: 137, y: 129 },
        { x: 609, y: 229 },
        { x: 554, y: 52 },
        { x: 401, y: 100 },
      ]
    },
    layout43: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 884, y: 162, value: 1, type: 'add' },
        { x: 556, y: 270, value: 2, type: 'add' },
        { x: 235, y: 144, value: 2, type: 'mult' },
        { x: 296, y: 176, value: 3, type: 'add' },
        { x: 296, y: 338, value: 2, type: 'mult' },
        { x: 167, y: 226, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 662, y: 366 },
        { x: 519, y: 419 },
        { x: 60, y: 137 },
        { x: 432, y: 117 },
        { x: 874, y: 353 },
      ]
    },
    layout44: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 730, y: 279, value: 2, type: 'mult' },
        { x: 936, y: 245, value: 3, type: 'mult' },
        { x: 870, y: 146, value: 4, type: 'add' },
        { x: 262, y: 179, value: 5, type: 'add' },
        { x: 202, y: 77, value: 5, type: 'add' },
        { x: 134, y: 419, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 609, y: 217 },
        { x: 740, y: 227 },
        { x: 274, y: 326 },
        { x: 427, y: 150 },
        { x: 798, y: 52 },
      ]
    },
    layout45: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 272, y: 385, value: 2, type: 'add' },
        { x: 226, y: 216, value: 3, type: 'mult' },
        { x: 308, y: 205, value: 2, type: 'mult' },
        { x: 500, y: 135, value: 3, type: 'mult' },
        { x: 490, y: 410, value: 1, type: 'add' },
        { x: 819, y: 316, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 203, y: 436 },
        { x: 531, y: 440 },
        { x: 814, y: 197 },
        { x: 468, y: 91 },
        { x: 397, y: 152 },
      ]
    },
    layout46: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 830, y: 314, value: 5, type: 'mult' },
        { x: 723, y: 258, value: 3, type: 'mult' },
        { x: 553, y: 432, value: 1, type: 'add' },
        { x: 718, y: 360, value: 4, type: 'mult' },
        { x: 511, y: 341, value: 3, type: 'add' },
        { x: 486, y: 212, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 905, y: 399 },
        { x: 330, y: 329 },
        { x: 668, y: 143 },
        { x: 564, y: 292 },
        { x: 495, y: 288 },
      ]
    },
    layout47: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 851, y: 324, value: 2, type: 'add' },
        { x: 353, y: 184, value: 2, type: 'add' },
        { x: 83, y: 89, value: 1, type: 'add' },
        { x: 184, y: 357, value: 2, type: 'mult' },
        { x: 875, y: 270, value: 2, type: 'mult' },
        { x: 804, y: 351, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 730, y: 243 },
        { x: 765, y: 315 },
        { x: 843, y: 185 },
        { x: 399, y: 240 },
        { x: 491, y: 255 },
      ]
    },
    layout48: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 359, y: 424, value: 1, type: 'add' },
        { x: 262, y: 113, value: 3, type: 'mult' },
        { x: 456, y: 179, value: 4, type: 'add' },
        { x: 546, y: 450, value: 4, type: 'add' },
        { x: 920, y: 201, value: 2, type: 'mult' },
        { x: 225, y: 205, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 769, y: 282 },
        { x: 655, y: 435 },
        { x: 245, y: 289 },
        { x: 470, y: 417 },
        { x: 142, y: 66 },
      ]
    },
    layout49: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 102, y: 360, value: 3, type: 'mult' },
        { x: 75, y: 142, value: 3, type: 'add' },
        { x: 195, y: 232, value: 2, type: 'mult' },
        { x: 278, y: 193, value: 2, type: 'mult' },
        { x: 771, y: 199, value: 3, type: 'mult' },
        { x: 911, y: 236, value: 4, type: 'add' },
      ],
      rockets: [
        { x: 536, y: 66 },
        { x: 648, y: 99 },
        { x: 400, y: 319 },
        { x: 183, y: 297 },
        { x: 406, y: 216 },
      ]
    },
    layout50: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 546, y: 351, value: 3, type: 'add' },
        { x: 448, y: 81, value: 1, type: 'add' },
        { x: 115, y: 103, value: 3, type: 'mult' },
        { x: 205, y: 410, value: 2, type: 'mult' },
        { x: 696, y: 278, value: 1, type: 'add' },
        { x: 299, y: 247, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 480, y: 443 },
        { x: 272, y: 86 },
        { x: 323, y: 367 },
        { x: 927, y: 200 },
        { x: 666, y: 354 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 51-60 ////////////////////
    layout51: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 355, y: 190, value: 5, type: 'mult' },
        { x: 222, y: 85, value: 4, type: 'mult' },
        { x: 831, y: 52, value: 3, type: 'mult' },
        { x: 614, y: 365, value: 3, type: 'mult' },
        { x: 80, y: 428, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 88, y: 161 },
        { x: 603, y: 312 },
        { x: 738, y: 87 },
        { x: 315, y: 328 },
        { x: 457, y: 105 },
        { x: 246, y: 224 },
      ]
    },
    layout52: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 380, y: 337, value: 2, type: 'mult' },
        { x: 150, y: 296, value: 2, type: 'mult' },
        { x: 722, y: 264, value: 5, type: 'mult' },
        { x: 615, y: 355, value: 1, type: 'add' },
        { x: 506, y: 287, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 631, y: 260 },
        { x: 883, y: 65 },
        { x: 479, y: 384 },
        { x: 439, y: 123 },
        { x: 154, y: 177 },
        { x: 215, y: 149 },
      ]
    },
    layout53: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 265, y: 226, value: 4, type: 'add' },
        { x: 261, y: 381, value: 4, type: 'add' },
        { x: 821, y: 271, value: 2, type: 'add' },
        { x: 177, y: 103, value: 3, type: 'add' },
        { x: 748, y: 160, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 192, y: 414 },
        { x: 203, y: 218 },
        { x: 108, y: 165 },
        { x: 184, y: 364 },
        { x: 574, y: 215 },
        { x: 666, y: 305 },
      ]
    },
    layout54: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 185, y: 373, value: 2, type: 'mult' },
        { x: 375, y: 394, value: 4, type: 'mult' },
        { x: 114, y: 438, value: 2, type: 'mult' },
        { x: 918, y: 413, value: 2, type: 'add' },
        { x: 554, y: 274, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 656, y: 307 },
        { x: 911, y: 121 },
        { x: 127, y: 264 },
        { x: 426, y: 256 },
        { x: 226, y: 140 },
        { x: 788, y: 152 },
      ]
    },
    layout55: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 53, y: 378, value: 2, type: 'mult' },
        { x: 907, y: 250, value: 1, type: 'add' },
        { x: 89, y: 433, value: 2, type: 'add' },
        { x: 901, y: 194, value: 3, type: 'mult' },
        { x: 398, y: 406, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 680, y: 374 },
        { x: 389, y: 85 },
        { x: 229, y: 171 },
        { x: 210, y: 362 },
        { x: 685, y: 247 },
        { x: 741, y: 380 },
      ]
    },
    layout56: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 115, y: 257, value: 4, type: 'mult' },
        { x: 911, y: 268, value: 2, type: 'mult' },
        { x: 281, y: 422, value: 5, type: 'add' },
        { x: 117, y: 131, value: 1, type: 'add' },
        { x: 271, y: 353, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 572, y: 106 },
        { x: 96, y: 422 },
        { x: 228, y: 204 },
        { x: 882, y: 185 },
        { x: 319, y: 279 },
        { x: 662, y: 354 },
      ]
    },
    layout57: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 832, y: 55, value: 3, type: 'mult' },
        { x: 492, y: 446, value: 5, type: 'add' },
        { x: 936, y: 229, value: 2, type: 'add' },
        { x: 706, y: 74, value: 2, type: 'mult' },
        { x: 479, y: 321, value: 10, type: 'add' },
      ],
      rockets: [
        { x: 67, y: 234 },
        { x: 734, y: 254 },
        { x: 231, y: 158 },
        { x: 655, y: 182 },
        { x: 757, y: 339 },
        { x: 838, y: 344 },
      ]
    },
    layout58: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 300, y: 176, value: 4, type: 'mult' },
        { x: 502, y: 220, value: 10, type: 'mult' },
        { x: 665, y: 251, value: 1, type: 'add' },
        { x: 492, y: 334, value: 2, type: 'mult' },
        { x: 435, y: 164, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 865, y: 236 },
        { x: 932, y: 234 },
        { x: 591, y: 149 },
        { x: 694, y: 202 },
        { x: 81, y: 401 },
        { x: 352, y: 336 },
      ]
    },
    layout59: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 891, y: 180, value: 4, type: 'add' },
        { x: 742, y: 230, value: 5, type: 'mult' },
        { x: 126, y: 54, value: 2, type: 'mult' },
        { x: 507, y: 247, value: 1, type: 'add' },
        { x: 468, y: 394, value: 10, type: 'add' },
      ],
      rockets: [
        { x: 647, y: 208 },
        { x: 792, y: 126 },
        { x: 437, y: 83 },
        { x: 52, y: 233 },
        { x: 554, y: 316 },
        { x: 109, y: 105 },
      ]
    },
    layout60: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 250, y: 138, value: 2, type: 'mult' },
        { x: 150, y: 163, value: 1, type: 'add' },
        { x: 457, y: 236, value: 3, type: 'mult' },
        { x: 237, y: 253, value: 3, type: 'mult' },
        { x: 891, y: 190, value: 4, type: 'add' },
      ],
      rockets: [
        { x: 677, y: 178 },
        { x: 625, y: 250 },
        { x: 890, y: 420 },
        { x: 119, y: 284 },
        { x: 577, y: 292 },
        { x: 590, y: 357 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 61-70 ////////////////////
    layout61: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 773, y: 356, value: 2, type: 'add' },
        { x: 508, y: 231, value: 2, type: 'add' },
        { x: 768, y: 60, value: 1, type: 'add' },
        { x: 537, y: 352, value: 2, type: 'add' },
        { x: 650, y: 164, value: 2, type: 'mult' },
        { x: 868, y: 113, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 384, y: 158 },
        { x: 351, y: 248 },
        { x: 183, y: 247 },
        { x: 159, y: 361 },
        { x: 235, y: 415 },
      ]
    },
    layout62: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 754, y: 157, value: 10, type: 'mult' },
        { x: 474, y: 374, value: 2, type: 'add' },
        { x: 591, y: 295, value: 4, type: 'add' },
        { x: 337, y: 442, value: 2, type: 'mult' },
        { x: 720, y: 113, value: 2, type: 'mult' },
        { x: 73, y: 377, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 408, y: 411 },
        { x: 755, y: 217 },
        { x: 604, y: 163 },
        { x: 205, y: 409 },
        { x: 162, y: 67 },
      ]
    },
    layout63: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 821, y: 173, value: 5, type: 'add' },
        { x: 774, y: 331, value: 1, type: 'add' },
        { x: 366, y: 352, value: 1, type: 'add' },
        { x: 736, y: 206, value: 1, type: 'add' },
        { x: 694, y: 299, value: 4, type: 'add' },
        { x: 794, y: 432, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 61, y: 339 },
        { x: 347, y: 413 },
        { x: 449, y: 135 },
        { x: 259, y: 417 },
        { x: 923, y: 195 },
      ]
    },
    layout64: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 104, y: 312, value: 2, type: 'add' },
        { x: 343, y: 381, value: 3, type: 'mult' },
        { x: 636, y: 160, value: 5, type: 'mult' },
        { x: 716, y: 107, value: 3, type: 'mult' },
        { x: 199, y: 198, value: 4, type: 'add' },
        { x: 439, y: 261, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 344, y: 117 },
        { x: 469, y: 433 },
        { x: 342, y: 205 },
        { x: 784, y: 222 },
        { x: 245, y: 222 },
      ]
    },
    layout65: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 584, y: 332, value: 1, type: 'add' },
        { x: 130, y: 320, value: 2, type: 'mult' },
        { x: 259, y: 387, value: 4, type: 'mult' },
        { x: 646, y: 277, value: 4, type: 'add' },
        { x: 285, y: 328, value: 2, type: 'add' },
        { x: 249, y: 120, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 467, y: 430 },
        { x: 295, y: 259 },
        { x: 133, y: 128 },
        { x: 697, y: 130 },
        { x: 932, y: 56 },
      ]
    },
    layout66: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 446, y: 271, value: 3, type: 'add' },
        { x: 709, y: 288, value: 3, type: 'mult' },
        { x: 153, y: 432, value: 1, type: 'add' },
        { x: 480, y: 375, value: 3, type: 'add' },
        { x: 393, y: 346, value: 3, type: 'mult' },
        { x: 237, y: 267, value: 4, type: 'add' },
      ],
      rockets: [
        { x: 933, y: 367 },
        { x: 523, y: 198 },
        { x: 121, y: 346 },
        { x: 564, y: 116 },
        { x: 362, y: 418 },
      ]
    },
    layout67: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 678, y: 285, value: 2, type: 'add' },
        { x: 132, y: 428, value: 4, type: 'add' },
        { x: 231, y: 408, value: 4, type: 'mult' },
        { x: 610, y: 221, value: 3, type: 'add' },
        { x: 823, y: 373, value: 2, type: 'mult' },
        { x: 320, y: 365, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 702, y: 60 },
        { x: 118, y: 366 },
        { x: 375, y: 317 },
        { x: 891, y: 204 },
        { x: 732, y: 280 },
      ]
    },
    layout68: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 722, y: 50, value: 4, type: 'add' },
        { x: 412, y: 261, value: 2, type: 'mult' },
        { x: 855, y: 268, value: 10, type: 'add' },
        { x: 934, y: 392, value: 5, type: 'mult' },
        { x: 73, y: 290, value: 4, type: 'add' },
        { x: 801, y: 164, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 432, y: 434 },
        { x: 408, y: 56 },
        { x: 905, y: 304 },
        { x: 230, y: 263 },
        { x: 865, y: 411 },
      ]
    },
    layout69: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 627, y: 139, value: 3, type: 'add' },
        { x: 903, y: 98, value: 3, type: 'mult' },
        { x: 797, y: 333, value: 1, type: 'add' },
        { x: 930, y: 446, value: 10, type: 'mult' },
        { x: 211, y: 216, value: 2, type: 'mult' },
        { x: 933, y: 374, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 419, y: 397 },
        { x: 163, y: 291 },
        { x: 500, y: 202 },
        { x: 875, y: 411 },
        { x: 333, y: 119 },
      ]
    },
    layout70: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 506, y: 159, value: 2, type: 'mult' },
        { x: 130, y: 280, value: 2, type: 'mult' },
        { x: 336, y: 157, value: 3, type: 'mult' },
        { x: 628, y: 393, value: 2, type: 'add' },
        { x: 351, y: 305, value: 2, type: 'add' },
        { x: 208, y: 405, value: 4, type: 'add' },
      ],
      rockets: [
        { x: 653, y: 94 },
        { x: 79, y: 350 },
        { x: 570, y: 255 },
        { x: 905, y: 443 },
        { x: 142, y: 135 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 71-80 ////////////////////
    layout71: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 81, y: 110, value: 10, type: 'add' },
        { x: 646, y: 102, value: 2, type: 'mult' },
        { x: 826, y: 324, value: 1, type: 'add' },
        { x: 294, y: 174, value: 3, type: 'mult' },
        { x: 52, y: 266, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 736, y: 385 },
        { x: 470, y: 83 },
        { x: 919, y: 154 },
        { x: 578, y: 151 },
      ]
    },
    layout72: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 207, y: 246, value: 2, type: 'add' },
        { x: 848, y: 332, value: 4, type: 'mult' },
        { x: 403, y: 264, value: 4, type: 'add' },
        { x: 918, y: 213, value: 10, type: 'mult' },
        { x: 851, y: 253, value: 4, type: 'mult' },
      ],
      rockets: [
        { x: 915, y: 425 },
        { x: 810, y: 125 },
        { x: 116, y: 219 },
        { x: 623, y: 165 },
      ]
    },
    layout73: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 586, y: 343, value: 2, type: 'mult' },
        { x: 462, y: 195, value: 2, type: 'mult' },
        { x: 587, y: 104, value: 3, type: 'add' },
        { x: 624, y: 442, value: 4, type: 'add' },
        { x: 735, y: 71, value: 4, type: 'mult' },
      ],
      rockets: [
        { x: 541, y: 307 },
        { x: 827, y: 89 },
        { x: 213, y: 350 },
        { x: 873, y: 232 },
      ]
    },
    layout74: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 854, y: 76, value: 3, type: 'add' },
        { x: 338, y: 103, value: 2, type: 'mult' },
        { x: 790, y: 236, value: 4, type: 'add' },
        { x: 333, y: 246, value: 1, type: 'add' },
        { x: 273, y: 417, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 159, y: 404 },
        { x: 423, y: 353 },
        { x: 827, y: 157 },
        { x: 579, y: 170 },
      ]
    },
    layout75: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 448, y: 337, value: 10, type: 'add' },
        { x: 88, y: 237, value: 4, type: 'add' },
        { x: 700, y: 186, value: 5, type: 'mult' },
        { x: 360, y: 171, value: 2, type: 'mult' },
        { x: 226, y: 101, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 62, y: 392 },
        { x: 691, y: 372 },
        { x: 627, y: 156 },
        { x: 780, y: 197 },
      ]
    },
    layout76: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 551, y: 266, value: 2, type: 'mult' },
        { x: 908, y: 441, value: 2, type: 'mult' },
        { x: 947, y: 345, value: 1, type: 'add' },
        { x: 709, y: 278, value: 2, type: 'mult' },
        { x: 204, y: 255, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 307, y: 419 },
        { x: 642, y: 295 },
        { x: 946, y: 194 },
        { x: 872, y: 253 },
      ]
    },
    layout77: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 284, y: 331, value: 2, type: 'mult' },
        { x: 585, y: 334, value: 2, type: 'mult' },
        { x: 740, y: 396, value: 4, type: 'add' },
        { x: 472, y: 385, value: 2, type: 'add' },
        { x: 76, y: 158, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 542, y: 417 },
        { x: 657, y: 450 },
        { x: 449, y: 288 },
        { x: 316, y: 404 },
      ]
    },
    layout78: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 661, y: 403, value: 5, type: 'mult' },
        { x: 311, y: 130, value: 2, type: 'mult' },
        { x: 126, y: 303, value: 2, type: 'mult' },
        { x: 465, y: 247, value: 2, type: 'add' },
        { x: 874, y: 55, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 810, y: 196 },
        { x: 68, y: 154 },
        { x: 275, y: 327 },
        { x: 873, y: 302 },
      ]
    },
    layout79: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 555, y: 176, value: 1, type: 'add' },
        { x: 133, y: 138, value: 2, type: 'mult' },
        { x: 390, y: 391, value: 3, type: 'mult' },
        { x: 279, y: 259, value: 2, type: 'mult' },
        { x: 155, y: 443, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 766, y: 207 },
        { x: 376, y: 165 },
        { x: 917, y: 200 },
        { x: 615, y: 53 },
      ]
    },
    layout80: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 86, y: 159, value: 5, type: 'add' },
        { x: 142, y: 449, value: 4, type: 'add' },
        { x: 934, y: 248, value: 2, type: 'mult' },
        { x: 810, y: 431, value: 2, type: 'mult' },
        { x: 204, y: 95, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 72, y: 423 },
        { x: 674, y: 290 },
        { x: 379, y: 57 },
        { x: 508, y: 86 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 81-90 ////////////////////
    layout81: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 775, y: 192, value: 2, type: 'add' },
        { x: 836, y: 449, value: 5, type: 'add' },
        { x: 587, y: 370, value: 3, type: 'add' },
        { x: 546, y: 230, value: 5, type: 'mult' },
        { x: 243, y: 322, value: 3, type: 'add' },
        { x: 276, y: 96, value: 2, type: 'mult' },
        { x: 338, y: 363, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 922, y: 191 },
        { x: 58, y: 208 },
        { x: 432, y: 301 },
      ]
    },
    layout82: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 205, y: 94, value: 4, type: 'add' },
        { x: 110, y: 191, value: 1, type: 'add' },
        { x: 306, y: 395, value: 2, type: 'add' },
        { x: 141, y: 134, value: 4, type: 'add' },
        { x: 459, y: 130, value: 2, type: 'mult' },
        { x: 106, y: 305, value: 2, type: 'mult' },
        { x: 323, y: 112, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 161, y: 274 },
        { x: 115, y: 251 },
        { x: 599, y: 293 },
      ]
    },
    layout83: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 789, y: 287, value: 2, type: 'mult' },
        { x: 848, y: 167, value: 3, type: 'mult' },
        { x: 733, y: 352, value: 5, type: 'add' },
        { x: 794, y: 115, value: 4, type: 'add' },
        { x: 659, y: 240, value: 4, type: 'add' },
        { x: 608, y: 289, value: 2, type: 'add' },
        { x: 112, y: 374, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 147, y: 302 },
        { x: 406, y: 182 },
        { x: 528, y: 223 },
      ]
    },
    layout84: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 891, y: 279, value: 3, type: 'mult' },
        { x: 182, y: 111, value: 2, type: 'mult' },
        { x: 625, y: 212, value: 2, type: 'mult' },
        { x: 334, y: 423, value: 3, type: 'mult' },
        { x: 557, y: 117, value: 1, type: 'add' },
        { x: 251, y: 78, value: 1, type: 'add' },
        { x: 631, y: 149, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 184, y: 298 },
        { x: 499, y: 62 },
        { x: 862, y: 127 },
      ]
    },
    layout85: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 434, y: 343, value: 1, type: 'add' },
        { x: 111, y: 140, value: 3, type: 'mult' },
        { x: 466, y: 244, value: 1, type: 'add' },
        { x: 546, y: 203, value: 2, type: 'mult' },
        { x: 172, y: 359, value: 5, type: 'add' },
        { x: 861, y: 140, value: 2, type: 'add' },
        { x: 253, y: 74, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 331, y: 305 },
        { x: 165, y: 182 },
        { x: 531, y: 400 },
      ]
    },
    layout86: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 811, y: 92, value: 1, type: 'add' },
        { x: 179, y: 259, value: 1, type: 'add' },
        { x: 641, y: 77, value: 1, type: 'add' },
        { x: 150, y: 175, value: 5, type: 'add' },
        { x: 899, y: 368, value: 2, type: 'mult' },
        { x: 903, y: 80, value: 3, type: 'mult' },
        { x: 372, y: 396, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 704, y: 110 },
        { x: 392, y: 323 },
        { x: 140, y: 438 },
      ]
    },
    layout87: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 397, y: 67, value: 2, type: 'mult' },
        { x: 554, y: 166, value: 4, type: 'mult' },
        { x: 398, y: 342, value: 3, type: 'add' },
        { x: 862, y: 145, value: 2, type: 'mult' },
        { x: 96, y: 218, value: 1, type: 'add' },
        { x: 814, y: 434, value: 2, type: 'add' },
        { x: 542, y: 242, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 576, y: 442 },
        { x: 712, y: 409 },
        { x: 345, y: 56 },
      ]
    },
    layout88: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 850, y: 369, value: 2, type: 'mult' },
        { x: 875, y: 92, value: 2, type: 'mult' },
        { x: 128, y: 419, value: 2, type: 'mult' },
        { x: 184, y: 256, value: 3, type: 'add' },
        { x: 148, y: 316, value: 3, type: 'mult' },
        { x: 697, y: 112, value: 4, type: 'mult' },
        { x: 77, y: 255, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 592, y: 316 },
        { x: 229, y: 148 },
        { x: 198, y: 392 },
      ]
    },
    layout89: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 555, y: 225, value: 2, type: 'mult' },
        { x: 901, y: 354, value: 2, type: 'add' },
        { x: 950, y: 56, value: 2, type: 'mult' },
        { x: 588, y: 150, value: 3, type: 'add' },
        { x: 803, y: 321, value: 5, type: 'mult' },
        { x: 468, y: 383, value: 2, type: 'add' },
        { x: 877, y: 74, value: 5, type: 'mult' },
      ],
      rockets: [
        { x: 590, y: 347 },
        { x: 278, y: 199 },
        { x: 338, y: 149 },
      ]
    },
    layout90: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 180, y: 234, value: 3, type: 'add' },
        { x: 887, y: 340, value: 4, type: 'mult' },
        { x: 773, y: 273, value: 2, type: 'mult' },
        { x: 251, y: 201, value: 3, type: 'mult' },
        { x: 293, y: 326, value: 3, type: 'mult' },
        { x: 724, y: 435, value: 5, type: 'add' },
        { x: 97, y: 71, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 823, y: 168 },
        { x: 322, y: 179 },
        { x: 284, y: 382 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 91-100 ////////////////////
  
    layout91: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 781, y: 164, value: 3, type: 'add' },
        { x: 322, y: 283, value: 2, type: 'add' },
        { x: 541, y: 424, value: 3, type: 'add' },
        { x: 571, y: 63, value: 2, type: 'mult' },
        { x: 622, y: 65, value: 2, type: 'add' },
        { x: 65, y: 190, value: 1, type: 'add' },
        { x: 443, y: 186, value: 4, type: 'mult' },
        { x: 691, y: 356, value: 2, type: 'mult' },
        { x: 682, y: 438, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 171, y: 63 },
        { x: 606, y: 336 },
        { x: 137, y: 324 },
      ]
    },
    layout92: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 908, y: 302, value: 3, type: 'mult' },
        { x: 733, y: 198, value: 2, type: 'mult' },
        { x: 503, y: 444, value: 1, type: 'add' },
        { x: 868, y: 260, value: 3, type: 'add' },
        { x: 550, y: 174, value: 3, type: 'add' },
        { x: 76, y: 380, value: 2, type: 'add' },
        { x: 435, y: 275, value: 5, type: 'add' },
        { x: 296, y: 263, value: 1, type: 'add' },
        { x: 562, y: 118, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 87, y: 148 },
        { x: 586, y: 242 },
        { x: 270, y: 397 },
      ]
    },
    layout93: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 681, y: 241, value: 5, type: 'mult' },
        { x: 501, y: 406, value: 3, type: 'mult' },
        { x: 763, y: 231, value: 2, type: 'add' },
        { x: 178, y: 425, value: 2, type: 'mult' },
        { x: 370, y: 77, value: 1, type: 'add' },
        { x: 130, y: 378, value: 2, type: 'mult' },
        { x: 528, y: 242, value: 3, type: 'mult' },
        { x: 257, y: 441, value: 5, type: 'add' },
        { x: 378, y: 398, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 883, y: 392 },
        { x: 873, y: 61 },
        { x: 829, y: 118 },
      ]
    },
    layout94: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 158, y: 58, value: 2, type: 'mult' },
        { x: 388, y: 288, value: 2, type: 'mult' },
        { x: 597, y: 231, value: 3, type: 'mult' },
        { x: 673, y: 290, value: 2, type: 'mult' },
        { x: 663, y: 214, value: 5, type: 'add' },
        { x: 483, y: 419, value: 1, type: 'add' },
        { x: 297, y: 343, value: 2, type: 'mult' },
        { x: 593, y: 331, value: 3, type: 'add' },
        { x: 534, y: 447, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 892, y: 219 },
        { x: 383, y: 124 },
        { x: 741, y: 393 },
      ]
    },
    layout95: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 233, y: 58, value: 3, type: 'add' },
        { x: 376, y: 417, value: 3, type: 'add' },
        { x: 890, y: 69, value: 10, type: 'add' },
        { x: 837, y: 229, value: 2, type: 'mult' },
        { x: 86, y: 132, value: 3, type: 'add' },
        { x: 709, y: 360, value: 4, type: 'mult' },
        { x: 434, y: 290, value: 2, type: 'add' },
        { x: 562, y: 328, value: 3, type: 'mult' },
        { x: 137, y: 401, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 668, y: 100 },
        { x: 363, y: 215 },
        { x: 514, y: 373 },
      ]
    },
    layout96: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 744, y: 366, value: 2, type: 'mult' },
        { x: 137, y: 239, value: 5, type: 'add' },
        { x: 463, y: 66, value: 2, type: 'mult' },
        { x: 561, y: 136, value: 1, type: 'add' },
        { x: 211, y: 158, value: 3, type: 'add' },
        { x: 410, y: 183, value: 2, type: 'add' },
        { x: 367, y: 281, value: 3, type: 'mult' },
        { x: 681, y: 179, value: 1, type: 'add' },
        { x: 242, y: 372, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 716, y: 85 },
        { x: 244, y: 77 },
        { x: 926, y: 369 },
      ]
    },
    layout97: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 762, y: 218, value: 2, type: 'add' },
        { x: 62, y: 223, value: 1, type: 'add' },
        { x: 278, y: 253, value: 3, type: 'add' },
        { x: 406, y: 200, value: 1, type: 'add' },
        { x: 481, y: 212, value: 2, type: 'add' },
        { x: 764, y: 85, value: 3, type: 'mult' },
        { x: 398, y: 378, value: 2, type: 'add' },
        { x: 836, y: 443, value: 3, type: 'add' },
        { x: 799, y: 265, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 375, y: 447 },
        { x: 76, y: 172 },
        { x: 745, y: 162 },
      ]
    },
    layout98: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 907, y: 201, value: 3, type: 'mult' },
        { x: 555, y: 56, value: 2, type: 'mult' },
        { x: 463, y: 400, value: 4, type: 'add' },
        { x: 453, y: 87, value: 1, type: 'add' },
        { x: 686, y: 242, value: 4, type: 'add' },
        { x: 739, y: 156, value: 5, type: 'add' },
        { x: 238, y: 390, value: 4, type: 'add' },
        { x: 563, y: 123, value: 2, type: 'mult' },
        { x: 280, y: 447, value: 4, type: 'add' },
      ],
      rockets: [
        { x: 280, y: 308 },
        { x: 915, y: 353 },
        { x: 331, y: 305 },
      ]
    },
    layout99: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 464, y: 104, value: 1, type: 'add' },
        { x: 392, y: 341, value: 2, type: 'mult' },
        { x: 890, y: 206, value: 2, type: 'mult' },
        { x: 172, y: 108, value: 2, type: 'mult' },
        { x: 156, y: 52, value: 2, type: 'add' },
        { x: 817, y: 230, value: 3, type: 'mult' },
        { x: 293, y: 201, value: 1, type: 'add' },
        { x: 618, y: 287, value: 3, type: 'add' },
        { x: 636, y: 76, value: 4, type: 'mult' },
      ],
      rockets: [
        { x: 578, y: 95 },
        { x: 83, y: 273 },
        { x: 716, y: 317 },
      ]
    },
    layout100: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 232, y: 412, value: 2, type: 'mult' },
        { x: 284, y: 420, value: 2, type: 'add' },
        { x: 55, y: 406, value: 1, type: 'add' },
        { x: 284, y: 352, value: 2, type: 'add' },
        { x: 122, y: 359, value: 4, type: 'mult' },
        { x: 97, y: 115, value: 3, type: 'add' },
        { x: 568, y: 90, value: 3, type: 'mult' },
        { x: 672, y: 124, value: 2, type: 'mult' },
        { x: 544, y: 181, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 442, y: 327 },
        { x: 457, y: 109 },
        { x: 946, y: 336 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 101-110 ////////////////////
    layout101: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 333, y: 113, value: 2, type: 'mult' },
        { x: 776, y: 391, value: 3, type: 'mult' },
        { x: 112, y: 271, value: 4, type: 'add' },
        { x: 359, y: 361, value: 3, type: 'add' },
        { x: 591, y: 103, value: 1, type: 'add' },
        { x: 553, y: 437, value: 3, type: 'mult' },
        { x: 199, y: 118, value: 2, type: 'add' },
        { x: 723, y: 195, value: 2, type: 'mult' },
        { x: 918, y: 216, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 278, y: 253 },
        { x: 480, y: 62 },
        { x: 686, y: 417 },
      ]
    },
    layout102: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 907, y: 297, value: 1, type: 'add' },
        { x: 762, y: 233, value: 3, type: 'add' },
        { x: 653, y: 230, value: 3, type: 'add' },
        { x: 530, y: 85, value: 4, type: 'mult' },
        { x: 711, y: 231, value: 2, type: 'mult' },
        { x: 263, y: 236, value: 1, type: 'add' },
        { x: 197, y: 53, value: 4, type: 'add' },
        { x: 861, y: 433, value: 5, type: 'mult' },
        { x: 741, y: 340, value: 4, type: 'mult' },
      ],
      rockets: [
        { x: 665, y: 305 },
        { x: 737, y: 180 },
        { x: 639, y: 89 },
      ]
    },
    layout103: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 83, y: 321, value: 2, type: 'mult' },
        { x: 452, y: 296, value: 3, type: 'mult' },
        { x: 880, y: 333, value: 3, type: 'add' },
        { x: 765, y: 113, value: 5, type: 'mult' },
        { x: 294, y: 160, value: 2, type: 'add' },
        { x: 263, y: 218, value: 1, type: 'add' },
        { x: 693, y: 395, value: 4, type: 'mult' },
        { x: 611, y: 271, value: 3, type: 'add' },
        { x: 201, y: 428, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 507, y: 408 },
        { x: 178, y: 180 },
        { x: 606, y: 161 },
      ]
    },
    layout104: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 64, y: 94, value: 2, type: 'mult' },
        { x: 174, y: 240, value: 1, type: 'add' },
        { x: 84, y: 268, value: 2, type: 'add' },
        { x: 532, y: 360, value: 2, type: 'add' },
        { x: 354, y: 333, value: 1, type: 'add' },
        { x: 406, y: 150, value: 3, type: 'mult' },
        { x: 906, y: 222, value: 2, type: 'mult' },
        { x: 108, y: 383, value: 10, type: 'mult' },
        { x: 853, y: 423, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 769, y: 167 },
        { x: 275, y: 379 },
        { x: 484, y: 279 },
      ]
    },
    layout105: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 467, y: 276, value: 3, type: 'add' },
        { x: 627, y: 75, value: 4, type: 'add' },
        { x: 104, y: 379, value: 10, type: 'add' },
        { x: 192, y: 236, value: 2, type: 'mult' },
        { x: 879, y: 180, value: 2, type: 'mult' },
        { x: 656, y: 333, value: 3, type: 'add' },
        { x: 826, y: 203, value: 3, type: 'mult' },
        { x: 940, y: 68, value: 5, type: 'add' },
        { x: 97, y: 237, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 458, y: 56 },
        { x: 872, y: 407 },
        { x: 266, y: 446 },
      ]
    },
    layout106: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 700, y: 185, value: 3, type: 'mult' },
        { x: 267, y: 394, value: 1, type: 'add' },
        { x: 418, y: 301, value: 2, type: 'add' },
        { x: 830, y: 105, value: 4, type: 'mult' },
        { x: 245, y: 60, value: 1, type: 'add' },
        { x: 130, y: 160, value: 3, type: 'mult' },
        { x: 558, y: 249, value: 5, type: 'mult' },
        { x: 51, y: 284, value: 2, type: 'mult' },
        { x: 153, y: 294, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 585, y: 51 },
        { x: 843, y: 297 },
        { x: 795, y: 153 },
      ]
    },
    layout107: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 695, y: 91, value: 2, type: 'mult' },
        { x: 365, y: 122, value: 4, type: 'mult' },
        { x: 347, y: 365, value: 2, type: 'mult' },
        { x: 474, y: 226, value: 2, type: 'mult' },
        { x: 663, y: 352, value: 2, type: 'mult' },
        { x: 59, y: 441, value: 2, type: 'mult' },
        { x: 796, y: 296, value: 2, type: 'mult' },
        { x: 251, y: 172, value: 3, type: 'mult' },
        { x: 718, y: 209, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 901, y: 122 },
        { x: 110, y: 162 },
        { x: 282, y: 69 },
      ]
    },
    layout108: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 443, y: 217, value: 1, type: 'add' },
        { x: 891, y: 392, value: 4, type: 'mult' },
        { x: 390, y: 417, value: 4, type: 'add' },
        { x: 561, y: 219, value: 2, type: 'add' },
        { x: 602, y: 270, value: 2, type: 'mult' },
        { x: 177, y: 90, value: 3, type: 'add' },
        { x: 551, y: 139, value: 1, type: 'add' },
        { x: 747, y: 94, value: 5, type: 'mult' },
        { x: 793, y: 268, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 275, y: 441 },
        { x: 91, y: 95 },
        { x: 929, y: 173 },
      ]
    },
    layout109: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 97, y: 220, value: 2, type: 'mult' },
        { x: 926, y: 198, value: 3, type: 'add' },
        { x: 684, y: 67, value: 4, type: 'mult' },
        { x: 533, y: 284, value: 3, type: 'mult' },
        { x: 247, y: 215, value: 3, type: 'mult' },
        { x: 597, y: 165, value: 2, type: 'mult' },
        { x: 724, y: 186, value: 4, type: 'mult' },
        { x: 533, y: 59, value: 1, type: 'add' },
        { x: 214, y: 394, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 289, y: 324 },
        { x: 809, y: 100 },
        { x: 718, y: 260 },
      ]
    },
    layout110: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 370, y: 389, value: 4, type: 'add' },
        { x: 184, y: 310, value: 1, type: 'add' },
        { x: 674, y: 239, value: 4, type: 'add' },
        { x: 856, y: 426, value: 2, type: 'add' },
        { x: 271, y: 210, value: 1, type: 'add' },
        { x: 231, y: 370, value: 1, type: 'add' },
        { x: 545, y: 82, value: 4, type: 'add' },
        { x: 454, y: 113, value: 1, type: 'add' },
        { x: 670, y: 54, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 484, y: 245 },
        { x: 403, y: 427 },
        { x: 467, y: 450 },
      ]
    },
  
    //////////////////// Multiplier - Rockets layouts 111-120 ////////////////////
    layout101: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 105, y: 293, value: 3, type: 'mult' },
        { x: 367, y: 77, value: 2, type: 'mult' },
        { x: 709, y: 172, value: 3, type: 'mult' },
        { x: 921, y: 249, value: 2, type: 'add' },
        { x: 715, y: 85, value: 3, type: 'add' },
        { x: 295, y: 174, value: 3, type: 'mult' },
        { x: 323, y: 392, value: 3, type: 'add' },
        { x: 621, y: 172, value: 4, type: 'mult' },
      ],
      rockets: [
        { x: 58, y: 120 },
        { x: 425, y: 392 },
        { x: 548, y: 257 },
        { x: 819, y: 256 },
      ]
    },
    layout102: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 949, y: 96, value: 3, type: 'mult' },
        { x: 253, y: 434, value: 2, type: 'mult' },
        { x: 789, y: 93, value: 4, type: 'mult' },
        { x: 944, y: 179, value: 5, type: 'add' },
        { x: 217, y: 183, value: 3, type: 'mult' },
        { x: 103, y: 342, value: 1, type: 'add' },
        { x: 776, y: 237, value: 2, type: 'mult' },
        { x: 636, y: 52, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 365, y: 392 },
        { x: 869, y: 359 },
        { x: 133, y: 202 },
        { x: 861, y: 272 },
      ]
    },
    layout103: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 252, y: 405, value: 5, type: 'add' },
        { x: 116, y: 407, value: 5, type: 'add' },
        { x: 787, y: 235, value: 1, type: 'add' },
        { x: 359, y: 344, value: 3, type: 'add' },
        { x: 570, y: 338, value: 2, type: 'mult' },
        { x: 291, y: 91, value: 3, type: 'add' },
        { x: 712, y: 360, value: 2, type: 'mult' },
        { x: 896, y: 218, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 114, y: 206 },
        { x: 932, y: 396 },
        { x: 889, y: 284 },
        { x: 927, y: 73 },
      ]
    },
    layout104: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 397, y: 292, value: 3, type: 'add' },
        { x: 798, y: 199, value: 3, type: 'add' },
        { x: 871, y: 271, value: 2, type: 'mult' },
        { x: 610, y: 102, value: 3, type: 'mult' },
        { x: 282, y: 95, value: 2, type: 'add' },
        { x: 737, y: 420, value: 1, type: 'add' },
        { x: 860, y: 323, value: 3, type: 'mult' },
        { x: 335, y: 186, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 851, y: 126 },
        { x: 577, y: 276 },
        { x: 546, y: 194 },
        { x: 154, y: 126 },
      ]
    },
    layout105: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 331, y: 326, value: 3, type: 'mult' },
        { x: 80, y: 306, value: 1, type: 'add' },
        { x: 542, y: 132, value: 1, type: 'add' },
        { x: 191, y: 75, value: 2, type: 'mult' },
        { x: 943, y: 359, value: 2, type: 'mult' },
        { x: 754, y: 219, value: 2, type: 'mult' },
        { x: 530, y: 389, value: 4, type: 'mult' },
        { x: 478, y: 206, value: 4, type: 'mult' },
      ],
      rockets: [
        { x: 445, y: 116 },
        { x: 704, y: 173 },
        { x: 193, y: 366 },
        { x: 550, y: 302 },
      ]
    },
    layout106: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 882, y: 388, value: 2, type: 'mult' },
        { x: 177, y: 150, value: 5, type: 'add' },
        { x: 747, y: 417, value: 4, type: 'add' },
        { x: 666, y: 285, value: 1, type: 'add' },
        { x: 919, y: 130, value: 4, type: 'mult' },
        { x: 645, y: 353, value: 2, type: 'mult' },
        { x: 117, y: 136, value: 3, type: 'mult' },
        { x: 576, y: 77, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 791, y: 201 },
        { x: 503, y: 369 },
        { x: 433, y: 187 },
        { x: 134, y: 270 },
      ]
    },
    layout107: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 611, y: 304, value: 4, type: 'add' },
        { x: 864, y: 190, value: 5, type: 'mult' },
        { x: 627, y: 177, value: 2, type: 'mult' },
        { x: 936, y: 223, value: 3, type: 'mult' },
        { x: 930, y: 381, value: 2, type: 'mult' },
        { x: 936, y: 437, value: 4, type: 'add' },
        { x: 296, y: 153, value: 1, type: 'add' },
        { x: 238, y: 209, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 881, y: 73 },
        { x: 496, y: 80 },
        { x: 338, y: 407 },
        { x: 263, y: 329 },
      ]
    },
    layout108: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 768, y: 448, value: 5, type: 'add' },
        { x: 934, y: 351, value: 1, type: 'add' },
        { x: 756, y: 85, value: 3, type: 'add' },
        { x: 237, y: 269, value: 1, type: 'add' },
        { x: 733, y: 259, value: 2, type: 'mult' },
        { x: 84, y: 200, value: 3, type: 'add' },
        { x: 631, y: 259, value: 1, type: 'add' },
        { x: 922, y: 114, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 56, y: 128 },
        { x: 281, y: 224 },
        { x: 287, y: 319 },
        { x: 385, y: 380 },
      ]
    },
    layout109: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 768, y: 64, value: 5, type: 'add' },
        { x: 302, y: 160, value: 3, type: 'add' },
        { x: 285, y: 368, value: 2, type: 'mult' },
        { x: 354, y: 293, value: 2, type: 'mult' },
        { x: 537, y: 67, value: 3, type: 'mult' },
        { x: 335, y: 89, value: 5, type: 'mult' },
        { x: 171, y: 281, value: 2, type: 'mult' },
        { x: 206, y: 359, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 99, y: 402 },
        { x: 116, y: 176 },
        { x: 622, y: 60 },
        { x: 544, y: 197 },
      ]
    },
    layout110: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 892, y: 414, value: 2, type: 'mult' },
        { x: 178, y: 57, value: 2, type: 'mult' },
        { x: 705, y: 72, value: 4, type: 'mult' },
        { x: 453, y: 349, value: 2, type: 'add' },
        { x: 310, y: 292, value: 5, type: 'add' },
        { x: 675, y: 200, value: 1, type: 'add' },
        { x: 464, y: 141, value: 1, type: 'add' },
        { x: 176, y: 209, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 270, y: 401 },
        { x: 527, y: 228 },
        { x: 620, y: 419 },
        { x: 895, y: 217 },
      ]
    },
    layout111: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 572, y: 270, value: 1, type: 'add' },
        { x: 65, y: 110, value: 3, type: 'mult' },
        { x: 178, y: 330, value: 3, type: 'mult' },
        { x: 551, y: 65, value: 1, type: 'add' },
        { x: 522, y: 371, value: 3, type: 'add' },
        { x: 116, y: 375, value: 4, type: 'add' },
        { x: 939, y: 165, value: 2, type: 'add' },
        { x: 888, y: 110, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 571, y: 168 },
        { x: 508, y: 169 },
        { x: 591, y: 98 },
        { x: 918, y: 391 },
      ]
    },
    layout112: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 812, y: 350, value: 4, type: 'add' },
        { x: 488, y: 116, value: 10, type: 'mult' },
        { x: 935, y: 160, value: 1, type: 'add' },
        { x: 235, y: 123, value: 1, type: 'add' },
        { x: 904, y: 101, value: 2, type: 'add' },
        { x: 103, y: 178, value: 1, type: 'add' },
        { x: 346, y: 158, value: 2, type: 'mult' },
        { x: 429, y: 242, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 128, y: 80 },
        { x: 499, y: 434 },
        { x: 533, y: 193 },
        { x: 129, y: 400 },
      ]
    },
    layout113: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 483, y: 286, value: 2, type: 'add' },
        { x: 577, y: 159, value: 2, type: 'mult' },
        { x: 312, y: 99, value: 2, type: 'mult' },
        { x: 814, y: 254, value: 3, type: 'mult' },
        { x: 678, y: 310, value: 3, type: 'add' },
        { x: 436, y: 229, value: 4, type: 'add' },
        { x: 726, y: 102, value: 1, type: 'add' },
        { x: 253, y: 272, value: 2, type: 'mult' },
      ],
      rockets: [
        { x: 100, y: 111 },
        { x: 704, y: 448 },
        { x: 210, y: 105 },
        { x: 504, y: 110 },
      ]
    },
    layout114: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 824, y: 324, value: 3, type: 'add' },
        { x: 587, y: 106, value: 2, type: 'mult' },
        { x: 235, y: 72, value: 3, type: 'mult' },
        { x: 323, y: 417, value: 3, type: 'add' },
        { x: 400, y: 234, value: 2, type: 'add' },
        { x: 511, y: 402, value: 4, type: 'add' },
        { x: 307, y: 299, value: 3, type: 'mult' },
        { x: 415, y: 57, value: 2, type: 'add' },
      ],
      rockets: [
        { x: 717, y: 86 },
        { x: 217, y: 241 },
        { x: 854, y: 218 },
        { x: 456, y: 426 },
      ]
    },
    layout115: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 700, y: 240, value: 2, type: 'mult' },
        { x: 166, y: 156, value: 4, type: 'mult' },
        { x: 891, y: 95, value: 2, type: 'mult' },
        { x: 62, y: 344, value: 2, type: 'mult' },
        { x: 167, y: 307, value: 2, type: 'mult' },
        { x: 267, y: 363, value: 4, type: 'mult' },
        { x: 860, y: 166, value: 3, type: 'mult' },
        { x: 564, y: 109, value: 1, type: 'add' },
      ],
      rockets: [
        { x: 66, y: 216 },
        { x: 909, y: 282 },
        { x: 354, y: 262 },
        { x: 579, y: 202 },
      ]
    },
    layout116: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 923, y: 353, value: 2, type: 'mult' },
        { x: 546, y: 391, value: 2, type: 'mult' },
        { x: 430, y: 335, value: 3, type: 'mult' },
        { x: 351, y: 207, value: 4, type: 'add' },
        { x: 948, y: 132, value: 2, type: 'mult' },
        { x: 742, y: 196, value: 4, type: 'add' },
        { x: 770, y: 55, value: 2, type: 'mult' },
        { x: 268, y: 287, value: 3, type: 'mult' },
      ],
      rockets: [
        { x: 507, y: 268 },
        { x: 836, y: 300 },
        { x: 360, y: 276 },
        { x: 120, y: 351 },
      ]
    },
    layout117: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 366, y: 336, value: 2, type: 'mult' },
        { x: 885, y: 344, value: 3, type: 'mult' },
        { x: 831, y: 378, value: 2, type: 'mult' },
        { x: 99, y: 319, value: 2, type: 'mult' },
        { x: 339, y: 133, value: 2, type: 'mult' },
        { x: 232, y: 262, value: 4, type: 'add' },
        { x: 859, y: 62, value: 5, type: 'add' },
        { x: 440, y: 432, value: 10, type: 'add' },
      ],
      rockets: [
        { x: 534, y: 228 },
        { x: 672, y: 369 },
        { x: 692, y: 172 },
        { x: 712, y: 321 },
      ]
    },
    layout118: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 694, y: 342, value: 2, type: 'add' },
        { x: 115, y: 147, value: 4, type: 'add' },
        { x: 639, y: 55, value: 2, type: 'mult' },
        { x: 422, y: 156, value: 3, type: 'mult' },
        { x: 98, y: 423, value: 4, type: 'mult' },
        { x: 343, y: 233, value: 5, type: 'add' },
        { x: 126, y: 342, value: 3, type: 'mult' },
        { x: 708, y: 241, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 283, y: 183 },
        { x: 559, y: 402 },
        { x: 65, y: 187 },
        { x: 207, y: 404 },
      ]
    },
    layout119: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 403, y: 312, value: 3, type: 'mult' },
        { x: 575, y: 443, value: 1, type: 'add' },
        { x: 661, y: 285, value: 3, type: 'add' },
        { x: 949, y: 390, value: 3, type: 'mult' },
        { x: 107, y: 339, value: 2, type: 'add' },
        { x: 879, y: 427, value: 1, type: 'add' },
        { x: 173, y: 265, value: 2, type: 'mult' },
        { x: 794, y: 385, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 288, y: 411 },
        { x: 908, y: 313 },
        { x: 409, y: 203 },
        { x: 930, y: 152 },
      ]
    },
    layout120: {
      width: 1000,
      height: 500,
      multipliers: [
        { x: 400, y: 242, value: 1, type: 'add' },
        { x: 155, y: 448, value: 2, type: 'add' },
        { x: 467, y: 63, value: 2, type: 'add' },
        { x: 931, y: 430, value: 1, type: 'add' },
        { x: 696, y: 284, value: 2, type: 'add' },
        { x: 604, y: 126, value: 3, type: 'mult' },
        { x: 565, y: 446, value: 1, type: 'add' },
        { x: 432, y: 196, value: 3, type: 'add' },
      ],
      rockets: [
        { x: 233, y: 328 },
        { x: 105, y: 221 },
        { x: 774, y: 280 },
        { x: 77, y: 269 },
      ]
    },
  };
  