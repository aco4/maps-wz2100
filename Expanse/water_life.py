# Generate all combinations of neighbors (256)
for a in [format(i, '08b') for i in range(256)]:

    s = str(a);

    quad1 = s[0] == '1' and s[1] == '1' and s[3] == '1'
    quad2 = s[1] == '1' and s[2] == '1' and s[4] == '1'
    quad3 = s[3] == '1' and s[5] == '1' and s[6] == '1'
    quad4 = s[4] == '1' and s[6] == '1' and s[7] == '1'
    num = quad1 + quad2 + quad3 + quad4
    if (num < 1):
        continue


    if (False):
        print(f'0b{s[0]}{s[1]}{s[2]}')
        print(f'  {s[3]} {s[4]}')
        print(f'  {s[5]}{s[6]}{s[7]},')
    else:
        print(f'0b{a},')
