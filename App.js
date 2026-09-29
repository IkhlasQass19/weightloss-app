import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const KEY = 'weightloss_tracker_v1';
const TARGETS = { calories: 1600, protein: 125, steps: 10000, targetWeight: 65 };

function todayKey() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

const emptyDay = () => ({ date: todayKey(), weight: '', calories: '', protein: '', steps: '', training: false, sleep: '', hunger: '', energy: '' });

export default function App() {
  const [days, setDays] = useState([]);
  const [day, setDay] = useState(emptyDay());
  const [tab, setTab] = useState('Today');

  useEffect(() => { (async () => {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      setDays(saved.days || []);
      const existing = (saved.days || []).find(x => x.date === todayKey());
      if (existing) setDay(existing);
    }
  })(); }, []);

  const save = async (nextDay = day) => {
    const next = [nextDay, ...days.filter(x => x.date !== nextDay.date)].sort((a,b) => b.date.localeCompare(a.date));
    setDay(nextDay); setDays(next);
    await AsyncStorage.setItem(KEY, JSON.stringify({ days: next }));
  };

  const avgWeight = useMemo(() => {
    const nums = days.map(x => Number(x.weight)).filter(Boolean);
    return nums.length ? nums.reduce((a,b)=>a+b,0)/nums.length : null;
  }, [days]);
  const latest = days.find(x => Number(x.weight));
  const progress = latest ? Math.max(0, Math.min(100, ((76.45 - Number(latest.weight)) / (76.45 - 65)) * 100)) : 0;

  const setField = (k, v) => setDay(d => ({ ...d, [k]: v }));
  const submit = () => save(day);

  return <SafeAreaView style={styles.safe}><StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Weight Loss Tracker</Text>
      <Text style={styles.subtitle}>Goal: 70 kg first - then 65 kg</Text>

      <View style={styles.cards}>
        <View style={styles.card}><Text style={styles.cardLabel}>Latest weight</Text><Text style={styles.cardValue}>{latest ? `${Number(latest.weight).toFixed(1)} kg` : '--'}</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Target</Text><Text style={styles.cardValue}>70.0 kg</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Days logged</Text><Text style={styles.cardValue}>{days.length}</Text></View>
      </View>

      <View style={styles.progressWrap}><View style={[styles.progress, {width: `${progress}%`}]} /></View>
      <Text style={styles.progressText}>{progress.toFixed(0)}% progress toward 65 kg</Text>

      <View style={styles.tabs}>
        {['Today','History'].map(t => <Pressable key={t} onPress={()=>setTab(t)} style={[styles.tab, tab===t && styles.tabActive]}><Text style={[styles.tabText, tab===t && styles.tabTextActive]}>{t}</Text></Pressable>)}
      </View>

      {tab === 'Today' ? <>
        <View style={styles.section}><Text style={styles.sectionTitle}>Daily targets</Text><Text style={styles.body}>~1,600 kcal  |  125-130 g protein  |  10,000-12,000 steps  |  3 strength sessions/week</Text></View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Log today</Text>
          <Field label="Date" value={day.date} onChangeText={v=>setField('date',v)} />
          <Field label="Weight (kg)" value={day.weight} keyboardType="decimal-pad" onChangeText={v=>setField('weight',v)} />
          <Field label="Calories" value={day.calories} keyboardType="number-pad" onChangeText={v=>setField('calories',v)} />
          <Field label="Protein (g)" value={day.protein} keyboardType="decimal-pad" onChangeText={v=>setField('protein',v)} />
          <Field label="Steps" value={day.steps} keyboardType="number-pad" onChangeText={v=>setField('steps',v)} />
          <Field label="Sleep (hours)" value={day.sleep} keyboardType="decimal-pad" onChangeText={v=>setField('sleep',v)} />
          <Field label="Hunger (1-10)" value={day.hunger} keyboardType="number-pad" onChangeText={v=>setField('hunger',v)} />
          <Field label="Energy (1-10)" value={day.energy} keyboardType="number-pad" onChangeText={v=>setField('energy',v)} />
          <Pressable onPress={()=>setField('training', !day.training)} style={[styles.toggle, day.training && styles.toggleOn]}><Text style={styles.toggleText}>{day.training ? 'Strength training: DONE' : 'Strength training: not logged'}</Text></Pressable>
          <Pressable onPress={submit} style={styles.save}><Text style={styles.saveText}>Save today's check-in</Text></Pressable>
        </View>
      </> : <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly history</Text>
        {days.length === 0 ? <Text style={styles.body}>No entries yet. Start logging your mornings and send me the weekly results.</Text> : days.map((x,i)=><View key={x.date+i} style={styles.row}><Text style={styles.rowDate}>{x.date}</Text><Text style={styles.rowMetric}>{x.weight ? `${x.weight} kg` : '--'}</Text><Text style={styles.rowMetric}>{x.steps ? `${x.steps}` : '--'} steps</Text></View>)}
        {avgWeight && <Text style={styles.body}>Average of logged weights: {avgWeight.toFixed(1)} kg</Text>}
        <Pressable onPress={()=>Alert.alert('Weekly report','Send me the last 7 days from this History screen. Include your average weight, average calories, average protein, average steps, and how hunger/energy/training felt.')} style={styles.secondary}><Text style={styles.secondaryText}>How to send me your weekly report</Text></Pressable>
      </View>}

      <View style={styles.note}><Text style={styles.noteTitle}>Coach note</Text><Text style={styles.noteText}>We will use your weekly trend, hunger, energy and training performance to adjust the plan. Do not crash-diet or compensate for a higher-calorie day.</Text></View>
    </ScrollView>
  </SafeAreaView>
}

function Field({label, ...props}) { return <View style={{marginBottom: 12}}><Text style={styles.label}>{label}</Text><TextInput {...props} style={styles.input} placeholder="Enter" placeholderTextColor="#9ca3af" /></View> }

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:'#f7f7f2'}, container:{padding:20,paddingBottom:40}, title:{fontSize:30,fontWeight:'800',color:'#173f35'}, subtitle:{fontSize:15,color:'#60736c',marginTop:4,marginBottom:18}, cards:{flexDirection:'row',gap:10}, card:{flex:1,backgroundColor:'#fff',borderRadius:16,padding:14,shadowColor:'#000',shadowOpacity:.05,shadowRadius:8,elevation:2}, cardLabel:{fontSize:12,color:'#718079'}, cardValue:{fontSize:20,fontWeight:'800',color:'#173f35',marginTop:6}, progressWrap:{height:12,borderRadius:20,backgroundColor:'#e1e8e4',marginTop:18,overflow:'hidden'}, progress:{height:12,backgroundColor:'#2d7a62',borderRadius:20}, progressText:{fontSize:12,color:'#60736c',marginTop:6}, tabs:{flexDirection:'row',marginTop:18,marginBottom:6,backgroundColor:'#e9eeeb',borderRadius:12,padding:4}, tab:{flex:1,padding:10,borderRadius:9,alignItems:'center'}, tabActive:{backgroundColor:'#fff'}, tabText:{color:'#61736d',fontWeight:'700'}, tabTextActive:{color:'#173f35'}, section:{backgroundColor:'#fff',borderRadius:18,padding:18,marginTop:14,shadowColor:'#000',shadowOpacity:.04,shadowRadius:8,elevation:1}, sectionTitle:{fontSize:20,fontWeight:'800',color:'#173f35',marginBottom:10}, body:{fontSize:14,lineHeight:20,color:'#5b6b65'}, label:{fontSize:12,fontWeight:'700',color:'#576962',marginBottom:5}, input:{borderWidth:1,borderColor:'#d9e1dd',borderRadius:10,paddingHorizontal:12,paddingVertical:11,fontSize:16,color:'#173f35',backgroundColor:'#fbfcfb'}, toggle:{padding:13,borderRadius:11,backgroundColor:'#eef2ef',marginTop:2}, toggleOn:{backgroundColor:'#dceee7'}, toggleText:{textAlign:'center',fontWeight:'700',color:'#205544'}, save:{marginTop:14,backgroundColor:'#173f35',borderRadius:12,padding:14,alignItems:'center'}, saveText:{color:'#fff',fontWeight:'800',fontSize:15}, row:{flexDirection:'row',paddingVertical:10,borderBottomWidth:1,borderBottomColor:'#edf1ee'}, rowDate:{flex:1,color:'#4e6059'}, rowMetric:{width:90,textAlign:'right',color:'#173f35',fontWeight:'700'}, secondary:{marginTop:14,padding:12,borderRadius:11,borderWidth:1,borderColor:'#bed2c9',alignItems:'center'}, secondaryText:{color:'#205544',fontWeight:'700'}, note:{marginTop:16,padding:16,borderRadius:16,backgroundColor:'#fff4dc'}, noteTitle:{fontWeight:'800',color:'#7b5716',marginBottom:4}, noteText:{fontSize:13,lineHeight:18,color:'#705d35'}
});
